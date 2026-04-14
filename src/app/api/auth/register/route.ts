import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/sql'

export async function POST(request: NextRequest) {
    try {
        const { email, name, password } = await request.json() as {
            email: string; name: string; password: string
        }

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
        if (existing.length > 0) {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
        }

        const hash = await bcrypt.hash(password, 10)

        await query(
            `INSERT INTO users (email, name, password_hash, role, status, tabs)
             VALUES ($1, $2, $3, 'viewer', 'pending', '[]')`,
            [email.toLowerCase(), name ?? '', hash]
        )

        return NextResponse.json({ ok: true }, { status: 201 })
    } catch (err) {
        console.error('POST /api/auth/register:', err)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
