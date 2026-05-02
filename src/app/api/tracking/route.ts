import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-server'
import { query } from '@/lib/sql'
import type { TrackingTrip } from '@/types/tracking'

function rowToTrip(r: Record<string, unknown>): TrackingTrip {
    const base = {
        id: r.id as string,
        warehouse: r.warehouse as 'PL2' | 'PL3',
        trip_type: r.trip_type as 'b2c' | 'b2b',
        date: r.date instanceof Date
            ? r.date.toISOString().slice(0, 10)
            : String(r.date).slice(0, 10),
        carrier: (r.carrier as string) ?? '',
        trip_number: (r.trip_number as string) ?? '',
        port: (r.port as string) ?? '',
        task_count: (r.task_count as number) ?? 0,
        operators: (() => { try { return JSON.parse(r.operators as string) } catch { return [] } })(),
        documents_printed: Boolean(r.documents_printed),
        status: r.status as TrackingTrip['status'],
        created_by: (r.created_by as string) ?? '',
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
    }

    if (r.trip_type === 'b2c') {
        return {
            ...base, trip_type: 'b2c',
            pallet_count: (r.pallet_count as number) ?? 0,
            pallets_dispatched: (r.pallets_dispatched as number) ?? 0,
            labeler: (r.labeler as string) ?? '',
            vehicle_plate: (r.vehicle_plate as string) || undefined,
            retira: (r.retira as string) || undefined,
        }
    }
    return {
        ...base, trip_type: 'b2b',
        vehicle_plate: (r.vehicle_plate as string) ?? '',
        client: (r.client as string) ?? '',
        client_shift: (r.client_shift as string) ?? '',
        pallets: (r.pallets as number) ?? 0,
        detail: (r.detail as string) ?? '',
        comments: (r.comments as string) ?? '',
        bulk_cargo: Boolean(r.bulk_cargo),
        retira: (r.retira as string) || undefined,
    }
}

export async function GET(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')
    const showDeleted = searchParams.get('showDeleted') === 'true'

    const params: unknown[] = []
    const conditions: string[] = []

    if (showDeleted) {
        conditions.push("status = 'deleted'")
    } else {
        conditions.push("status != 'deleted'")
    }

    if (warehouse) {
        params.push(warehouse)
        conditions.push(`warehouse = $${params.length}`)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    try {
        const rows = await query(`SELECT * FROM tracking_trips ${where} ORDER BY created_at DESC`, params)
        return NextResponse.json(rows.map(rowToTrip))
    } catch (error) {
        console.error('Error in GET /api/tracking:', error)
        return NextResponse.json({ error: 'Error al obtener los viajes' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const b = await request.json() as Partial<TrackingTrip>

    try {
        const rows = await query(
            `INSERT INTO tracking_trips (
                warehouse, trip_type, date, carrier, trip_number, port,
                task_count, operators, documents_printed, status, created_by,
                pallet_count, pallets_dispatched, labeler,
                vehicle_plate, client, client_shift, pallets, detail, comments, bulk_cargo, retira
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
            RETURNING *`,
            [
                b.warehouse, b.trip_type, b.date, b.carrier ?? '', b.trip_number ?? '', b.port ?? '',
                b.task_count ?? 0, JSON.stringify(b.operators ?? []),
                b.documents_printed ?? false, b.status ?? 'pending', user.id,
                (b as Record<string, unknown>).pallet_count ?? null,
                (b as Record<string, unknown>).pallets_dispatched ?? null,
                (b as Record<string, unknown>).labeler ?? null,
                (b as Record<string, unknown>).vehicle_plate ?? null,
                (b as Record<string, unknown>).client ?? null,
                (b as Record<string, unknown>).client_shift ?? null,
                (b as Record<string, unknown>).pallets ?? null,
                (b as Record<string, unknown>).detail ?? null,
                (b as Record<string, unknown>).comments ?? null,
                (b as Record<string, unknown>).bulk_cargo ?? null,
                (b as Record<string, unknown>).retira ?? null,
            ]
        )
        return NextResponse.json(rowToTrip(rows[0]), { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/tracking:', error)
        return NextResponse.json({ error: 'Error al guardar el viaje' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as Record<string, unknown> & { id: string }
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    const ALLOWED_FIELDS = [
        'carrier', 'status', 'trip_number', 'port', 'task_count', 'documents_printed',
        'pallet_count', 'pallets_dispatched', 'labeler',
        'vehicle_plate', 'client', 'client_shift', 'pallets', 'detail', 'comments', 'bulk_cargo', 'retira',
    ]

    const setClauses: string[] = ['updated_at = NOW()']
    const params: unknown[] = []

    for (const field of ALLOWED_FIELDS) {
        if (field in updates) {
            let val = updates[field]
            if (field === 'operators') val = JSON.stringify(val)
            params.push(val)
            setClauses.push(`${field} = $${params.length}`)
        }
    }

    if (updates.operators !== undefined) {
        params.push(JSON.stringify(updates.operators))
        setClauses.push(`operators = $${params.length}`)
    }

    params.push(id)
    try {
        const rows = await query(
            `UPDATE tracking_trips SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
            params
        )
        return NextResponse.json(rowToTrip(rows[0]))
    } catch (error) {
        console.error('Error in PUT /api/tracking:', error)
        return NextResponse.json({ error: 'Error al actualizar el viaje' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const isPermanent = searchParams.get('permanent') === 'true'
    const warehouse = searchParams.get('warehouse')

    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    try {
        if (isPermanent) {
            if (user.role !== 'superadmin' && user.role !== 'admin') {
                return NextResponse.json({ error: 'Se requieren permisos de administrador para borrado permanente' }, { status: 403 })
            }
            if (id === 'all') {
                const params: unknown[] = []
                let extra = ''
                if (warehouse) { params.push(warehouse); extra = ` AND warehouse = $${params.length}` }
                await query(`DELETE FROM tracking_trips WHERE status = 'deleted'${extra}`, params)
            } else {
                await query('DELETE FROM tracking_trips WHERE id = $1', [id])
            }
        } else {
            await query("UPDATE tracking_trips SET status = 'deleted', updated_at = NOW() WHERE id = $1", [id])
        }
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/tracking:', error)
        return NextResponse.json({ error: 'Error al eliminar el viaje' }, { status: 500 })
    }
}
