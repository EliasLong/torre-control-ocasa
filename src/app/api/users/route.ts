import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSessionUser } from '@/lib/auth-server'
import { query } from '@/lib/sql'
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

    const rows = await query(
        'SELECT id, email, name, role, status, tabs, created_at FROM users ORDER BY created_at DESC'
    )

    return NextResponse.json(rows.map((r: Record<string, unknown>) => ({
        ...r,
        tabs: (() => { try { return JSON.parse(r.tabs as string) } catch { return [] } })(),
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

    await query(
        `INSERT INTO users (email, name, password_hash, role, status, tabs)
         VALUES ($1, $2, $3, $4, 'approved', '[]')`,
        [email.toLowerCase(), name ?? '', hash, role ?? 'viewer']
    )

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

    if (body.status !== undefined) {
        await query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2', [body.status, body.id])
    }
    if (body.role !== undefined) {
        await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [body.role, body.id])
    }
    if (body.tabs !== undefined) {
        await query('UPDATE users SET tabs = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(body.tabs), body.id])
    }

    return NextResponse.json({ ok: true })
}

// DELETE — remove user
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin()
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { id } = await request.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'id es requerido' }, { status: 400 })

    if (id === auth.user.id) {
        return NextResponse.json({ error: 'No podés eliminar tu propio usuario' }, { status: 400 })
    }

    await query('DELETE FROM users WHERE id = $1', [id])
    return NextResponse.json({ ok: true })
}
