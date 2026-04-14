import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-server'
import { query } from '@/lib/sql'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToIncidencia(r: Record<string, any>) {
    return {
        id: r.id,
        warehouse: r.warehouse,
        titulo: r.titulo,
        descripcion: r.descripcion,
        tipo: r.tipo,
        prioridad: r.prioridad,
        estado: r.estado,
        created_by: r.created_by,
        assigned_to: r.assigned_to,
        created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
        updated_at: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
        resolved_at: r.resolved_at instanceof Date ? r.resolved_at?.toISOString() : r.resolved_at,
    }
}

export async function GET(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')
    const estado = searchParams.get('estado')

    const conditions: string[] = []
    const params: unknown[] = []

    if (warehouse) { params.push(warehouse); conditions.push(`warehouse = $${params.length}`) }
    if (estado) { params.push(estado); conditions.push(`estado = $${params.length}`) }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = await query(`SELECT * FROM incidencias ${where} ORDER BY created_at DESC`, params)

    return NextResponse.json(rows.map(rowToIncidencia))
}

export async function POST(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as {
        warehouse: string; titulo: string; descripcion?: string; tipo?: string; prioridad?: string
    }

    if (!body.warehouse || !body.titulo) {
        return NextResponse.json({ error: 'warehouse y titulo son requeridos' }, { status: 400 })
    }

    const rows = await query(
        `INSERT INTO incidencias (warehouse, titulo, descripcion, tipo, prioridad, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [body.warehouse, body.titulo, body.descripcion ?? '', body.tipo ?? 'operacional', body.prioridad ?? 'media', user.id]
    )

    return NextResponse.json(rowToIncidencia(rows[0]), { status: 201 })
}

export async function PATCH(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as {
        id: string; estado?: string; prioridad?: string; assigned_to?: string
    }

    if (!body.id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    if (body.estado !== undefined) {
        const isResolved = body.estado === 'resuelta' || body.estado === 'cerrada'
        await query(
            `UPDATE incidencias SET estado = $1, updated_at = NOW()${isResolved ? ', resolved_at = NOW()' : ''} WHERE id = $2`,
            [body.estado, body.id]
        )
    }
    if (body.prioridad !== undefined) {
        await query('UPDATE incidencias SET prioridad = $1, updated_at = NOW() WHERE id = $2', [body.prioridad, body.id])
    }
    if (body.assigned_to !== undefined) {
        await query('UPDATE incidencias SET assigned_to = $1, updated_at = NOW() WHERE id = $2', [body.assigned_to || null, body.id])
    }

    return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    if (user.role !== 'superadmin' && user.role !== 'admin') {
        return NextResponse.json({ error: 'Solo administradores pueden eliminar incidencias' }, { status: 403 })
    }

    const { id } = await request.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    await query('DELETE FROM incidencias WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
}
