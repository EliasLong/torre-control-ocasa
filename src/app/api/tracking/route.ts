import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-server'
import { getPool, sql } from '@/lib/sql'
import type { TrackingTrip } from '@/types/tracking'

// Convert a DB row to a TrackingTrip
function rowToTrip(r: Record<string, unknown>): TrackingTrip {
    const base = {
        id: r.id as string,
        warehouse: r.warehouse as 'PL2' | 'PL3',
        trip_type: r.trip_type as 'b2c' | 'b2b',
        date: (r.date as Date)?.toISOString?.().slice(0, 10) ?? String(r.date),
        carrier: (r.carrier as string) ?? '',
        trip_number: (r.trip_number as string) ?? '',
        port: (r.port as string) ?? '',
        task_count: (r.task_count as number) ?? 0,
        operators: (() => { try { return JSON.parse(r.operators as string) } catch { return [] } })(),
        documents_printed: Boolean(r.documents_printed),
        status: r.status as TrackingTrip['status'],
        created_by: (r.created_by as string) ?? '',
        created_at: (r.created_at as Date)?.toISOString?.() ?? String(r.created_at),
        updated_at: (r.updated_at as Date)?.toISOString?.() ?? String(r.updated_at),
    }

    if (r.trip_type === 'b2c') {
        return {
            ...base,
            trip_type: 'b2c',
            pallet_count: (r.pallet_count as number) ?? 0,
            pallets_dispatched: (r.pallets_dispatched as number) ?? 0,
            labeler: (r.labeler as string) ?? '',
            vehicle_plate: (r.vehicle_plate as string) ?? undefined,
            retira: (r.retira as string) ?? undefined,
        }
    }

    return {
        ...base,
        trip_type: 'b2b',
        vehicle_plate: (r.vehicle_plate as string) ?? '',
        client: (r.client as string) ?? '',
        client_shift: (r.client_shift as string) ?? '',
        pallets: (r.pallets as number) ?? 0,
        detail: (r.detail as string) ?? '',
        comments: (r.comments as string) ?? '',
        bulk_cargo: Boolean(r.bulk_cargo),
        retira: (r.retira as string) ?? undefined,
    }
}

export async function GET(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')
    const showDeleted = searchParams.get('showDeleted') === 'true'

    const pool = await getPool()
    const req = pool.request()

    let where = showDeleted ? "status = 'deleted'" : "status != 'deleted'"
    if (warehouse) {
        req.input('warehouse', sql.NVarChar, warehouse)
        where += ' AND warehouse = @warehouse'
    }

    const result = await req.query(`
        SELECT * FROM tracking_trips
        WHERE ${where}
        ORDER BY created_at DESC
    `)

    return NextResponse.json(result.recordset.map(rowToTrip))
}

export async function POST(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as Partial<TrackingTrip>
    const pool = await getPool()

    const r = pool.request()
        .input('warehouse', sql.NVarChar, body.warehouse)
        .input('trip_type', sql.NVarChar, body.trip_type)
        .input('date', sql.Date, body.date)
        .input('carrier', sql.NVarChar, body.carrier ?? '')
        .input('trip_number', sql.NVarChar, body.trip_number ?? '')
        .input('port', sql.NVarChar, body.port ?? '')
        .input('task_count', sql.Int, body.task_count ?? 0)
        .input('operators', sql.NVarChar, JSON.stringify(body.operators ?? []))
        .input('documents_printed', sql.Bit, body.documents_printed ? 1 : 0)
        .input('status', sql.NVarChar, body.status ?? 'pending')
        .input('created_by', sql.UniqueIdentifier, user.id)
        // B2C
        .input('pallet_count', sql.Int, (body as { pallet_count?: number }).pallet_count ?? null)
        .input('pallets_dispatched', sql.Int, (body as { pallets_dispatched?: number }).pallets_dispatched ?? null)
        .input('labeler', sql.NVarChar, (body as { labeler?: string }).labeler ?? null)
        // B2B
        .input('vehicle_plate', sql.NVarChar, (body as { vehicle_plate?: string }).vehicle_plate ?? null)
        .input('client', sql.NVarChar, (body as { client?: string }).client ?? null)
        .input('client_shift', sql.NVarChar, (body as { client_shift?: string }).client_shift ?? null)
        .input('pallets', sql.Int, (body as { pallets?: number }).pallets ?? null)
        .input('detail', sql.NVarChar, (body as { detail?: string }).detail ?? null)
        .input('comments', sql.NVarChar, (body as { comments?: string }).comments ?? null)
        .input('bulk_cargo', sql.Bit, (body as { bulk_cargo?: boolean }).bulk_cargo ? 1 : 0)
        .input('retira', sql.NVarChar, (body as { retira?: string }).retira ?? null)

    const result = await r.query(`
        INSERT INTO tracking_trips (
            warehouse, trip_type, date, carrier, trip_number, port,
            task_count, operators, documents_printed, status, created_by,
            pallet_count, pallets_dispatched, labeler,
            vehicle_plate, client, client_shift, pallets, detail, comments, bulk_cargo, retira
        )
        OUTPUT INSERTED.*
        VALUES (
            @warehouse, @trip_type, @date, @carrier, @trip_number, @port,
            @task_count, @operators, @documents_printed, @status, @created_by,
            @pallet_count, @pallets_dispatched, @labeler,
            @vehicle_plate, @client, @client_shift, @pallets, @detail, @comments, @bulk_cargo, @retira
        )
    `)

    return NextResponse.json(rowToTrip(result.recordset[0]), { status: 201 })
}

export async function PUT(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as Partial<TrackingTrip> & { id: string }
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    const pool = await getPool()
    const setClauses: string[] = ['updated_at = SYSUTCDATETIME()']
    const r = pool.request().input('id', sql.UniqueIdentifier, id)

    const addField = (key: string, type: sql.ISqlType | (() => sql.ISqlType), val: unknown) => {
        r.input(key, type as sql.ISqlType, val)
        setClauses.push(`${key} = @${key}`)
    }

    if (updates.carrier !== undefined) addField('carrier', sql.NVarChar, updates.carrier)
    if (updates.status !== undefined) addField('status', sql.NVarChar, updates.status)
    if (updates.trip_number !== undefined) addField('trip_number', sql.NVarChar, updates.trip_number)
    if (updates.port !== undefined) addField('port', sql.NVarChar, updates.port)
    if (updates.task_count !== undefined) addField('task_count', sql.Int, updates.task_count)
    if (updates.operators !== undefined) addField('operators', sql.NVarChar, JSON.stringify(updates.operators))
    if (updates.documents_printed !== undefined) addField('documents_printed', sql.Bit, updates.documents_printed ? 1 : 0)
    if ((updates as { pallet_count?: number }).pallet_count !== undefined) addField('pallet_count', sql.Int, (updates as { pallet_count?: number }).pallet_count)
    if ((updates as { pallets_dispatched?: number }).pallets_dispatched !== undefined) addField('pallets_dispatched', sql.Int, (updates as { pallets_dispatched?: number }).pallets_dispatched)
    if ((updates as { labeler?: string }).labeler !== undefined) addField('labeler', sql.NVarChar, (updates as { labeler?: string }).labeler)
    if ((updates as { vehicle_plate?: string }).vehicle_plate !== undefined) addField('vehicle_plate', sql.NVarChar, (updates as { vehicle_plate?: string }).vehicle_plate)
    if ((updates as { client?: string }).client !== undefined) addField('client', sql.NVarChar, (updates as { client?: string }).client)
    if ((updates as { client_shift?: string }).client_shift !== undefined) addField('client_shift', sql.NVarChar, (updates as { client_shift?: string }).client_shift)
    if ((updates as { pallets?: number }).pallets !== undefined) addField('pallets', sql.Int, (updates as { pallets?: number }).pallets)
    if ((updates as { detail?: string }).detail !== undefined) addField('detail', sql.NVarChar, (updates as { detail?: string }).detail)
    if ((updates as { comments?: string }).comments !== undefined) addField('comments', sql.NVarChar, (updates as { comments?: string }).comments)
    if ((updates as { bulk_cargo?: boolean }).bulk_cargo !== undefined) addField('bulk_cargo', sql.Bit, (updates as { bulk_cargo?: boolean }).bulk_cargo ? 1 : 0)
    if ((updates as { retira?: string }).retira !== undefined) addField('retira', sql.NVarChar, (updates as { retira?: string }).retira)

    const result = await r.query(`
        UPDATE tracking_trips
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = @id
    `)

    return NextResponse.json(rowToTrip(result.recordset[0]))
}

export async function DELETE(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const isPermanent = searchParams.get('permanent') === 'true'

    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    const pool = await getPool()

    if (isPermanent) {
        if (user.role !== 'superadmin' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Se requieren permisos de administrador para borrado permanente' }, { status: 403 })
        }

        if (id === 'all') {
            await pool.request().query("DELETE FROM tracking_trips WHERE status = 'deleted'")
        } else {
            await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .query('DELETE FROM tracking_trips WHERE id = @id')
        }
    } else {
        await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query("UPDATE tracking_trips SET status = 'deleted', updated_at = SYSUTCDATETIME() WHERE id = @id")
    }

    return NextResponse.json({ success: true })
}
