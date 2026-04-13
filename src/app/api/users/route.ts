import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionUser } from '@/lib/auth-server'
import { getPool, sql } from '@/lib/sql'
import type { UserRole, TabPermission } from '@/types'

async function requireAdmin() {
    const user = await getSessionUser()
    if (!user) return { error: 'No autenticado', status: 401 }
    if (user.role !== 'superadmin' && user.role !== 'admin') {
        return { error: 'Se requieren permisos de administrador', status: 403 }
    }
    return { user }
}

// GET — list all users
export async function GET() {
    const auth = await requireAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const pool = await getPool()
    const result = await pool.request().query(`
        SELECT id, email, name, role, status, tabs, created_at
        FROM users
        ORDER BY created_at DESC
    `)

    return NextResponse.json(result.recordset.map(r => ({
        ...r,
        tabs: (() => { try { return JSON.parse(r.tabs) } catch { return [] } })(),
        password: '',
        createdAt: r.created_at,
    })))
}

// POST — create user
export async function POST(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { email, name, password, role } = await request.json() as {
        email: string; name: string; password: string; role: UserRole
    }

    if (!email || !password) {
        return NextResponse.json({ error: 'email y password son requeridos' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 10)
    const pool = await getPool()

    await pool.request()
        .input('email', sql.NVarChar, email.toLowerCase())
        .input('name', sql.NVarChar, name ?? '')
        .input('hash', sql.NVarChar, hash)
        .input('role', sql.NVarChar, role ?? 'viewer')
        .query(`
            INSERT INTO users (email, name, password_hash, role, status, tabs)
            VALUES (@email, @name, @hash, @role, 'approved', '[]')
        `)

    return NextResponse.json({ ok: true }, { status: 201 })
}

// PATCH — update status / role / tabs
export async function PATCH(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const body = await request.json() as {
        id: string
        status?: 'pending' | 'approved' | 'rejected'
        role?: UserRole
        tabs?: TabPermission[]
    }

    if (!body.id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    const pool = await getPool()

    if (body.status !== undefined) {
        await pool.request()
            .input('id', sql.UniqueIdentifier, body.id)
            .input('status', sql.NVarChar, body.status)
            .query('UPDATE users SET status = @status, updated_at = SYSUTCDATETIME() WHERE id = @id')
    }

    if (body.role !== undefined) {
        await pool.request()
            .input('id', sql.UniqueIdentifier, body.id)
            .input('role', sql.NVarChar, body.role)
            .query('UPDATE users SET role = @role, updated_at = SYSUTCDATETIME() WHERE id = @id')
    }

    if (body.tabs !== undefined) {
        await pool.request()
            .input('id', sql.UniqueIdentifier, body.id)
            .input('tabs', sql.NVarChar, JSON.stringify(body.tabs))
            .query('UPDATE users SET tabs = @tabs, updated_at = SYSUTCDATETIME() WHERE id = @id')
    }

    return NextResponse.json({ ok: true })
}

// DELETE — remove user
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await request.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    // Prevent self-deletion
    if (id === auth.user.id) {
        return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 })
    }

    const pool = await getPool()
    await pool.request()
        .input('id', sql.UniqueIdentifier, id)
        .query('DELETE FROM users WHERE id = @id')

    return NextResponse.json({ ok: true })
}
