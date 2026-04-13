import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-server'
import { getPool, sql } from '@/lib/sql'

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

    const pool = await getPool()
    const r = pool.request()
    const conditions: string[] = []

    if (warehouse) { r.input('warehouse', sql.NVarChar, warehouse); conditions.push('warehouse = @warehouse') }
    if (estado) { r.input('estado', sql.NVarChar, estado); conditions.push('estado = @estado') }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await r.query(`SELECT * FROM incidencias ${where} ORDER BY created_at DESC`)

    return NextResponse.json(result.recordset.map(rowToIncidencia))
}

export async function POST(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as {
        warehouse: string; titulo: string; descripcion?: string
        tipo?: string; prioridad?: string
    }

    if (!body.warehouse || !body.titulo) {
        return NextResponse.json({ error: 'warehouse y titulo son requeridos' }, { status: 400 })
    }

    const pool = await getPool()
    const result = await pool.request()
        .input('warehouse', sql.NVarChar, body.warehouse)
        .input('titulo', sql.NVarChar, body.titulo)
        .input('descripcion', sql.NVarChar, body.descripcion ?? '')
        .input('tipo', sql.NVarChar, body.tipo ?? 'operacional')
        .input('prioridad', sql.NVarChar, body.prioridad ?? 'media')
        .input('created_by', sql.UniqueIdentifier, user.id)
        .query(`
            INSERT INTO incidencias (warehouse, titulo, descripcion, tipo, prioridad, created_by)
            OUTPUT INSERTED.*
            VALUES (@warehouse, @titulo, @descripcion, @tipo, @prioridad, @created_by)
        `)

    return NextResponse.json(rowToIncidencia(result.recordset[0]), { status: 201 })
}

export async function PATCH(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json() as {
        id: string; estado?: string; prioridad?: string
        assigned_to?: string; resolved_at?: string | null
    }

    if (!body.id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    const pool = await getPool()
    const setClauses = ['updated_at = SYSUTCDATETIME()']
    const r = pool.request().input('id', sql.UniqueIdentifier, body.id)

    if (body.estado !== undefined) {
        r.input('estado', sql.NVarChar, body.estado)
        setClauses.push('estado = @estado')
        if (body.estado === 'resuelta' || body.estado === 'cerrada') {
            r.input('resolved_at', sql.DateTime2, new Date())
            setClauses.push('resolved_at = @resolved_at')
        }
    }

    if (body.prioridad !== undefined) {
        r.input('prioridad', sql.NVarChar, body.prioridad)
        setClauses.push('prioridad = @prioridad')
    }

    if (body.assigned_to !== undefined) {
        r.input('assigned_to', sql.UniqueIdentifier, body.assigned_to || null)
        setClauses.push('assigned_to = @assigned_to')
    }

    await r.query(`UPDATE incidencias SET ${setClauses.join(', ')} WHERE id = @id`)
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

    const pool = await getPool()
    await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query('DELETE FROM incidencias WHERE id = @id')

    return NextResponse.json({ ok: true })
}
