import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPool, sql } from '@/lib/sql'

export async function POST(request: NextRequest) {
    try {
        const { email, name, password } = await request.json() as {
            email: string
            name: string
            password: string
        }

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        const pool = await getPool()

        // Check if email already taken
        const existing = await pool.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query('SELECT id FROM users WHERE email = @email')

        if (existing.recordset.length > 0) {
            return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
        }

        const hash = await bcrypt.hash(password, 10)

        await pool.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .input('name', sql.NVarChar, name ?? '')
            .input('hash', sql.NVarChar, hash)
            .query(`
                INSERT INTO users (email, name, password_hash, role, status, tabs)
                VALUES (@email, @name, @hash, 'viewer', 'pending', '[]')
            `)

        return NextResponse.json({ ok: true }, { status: 201 })
    } catch (err) {
        console.error('POST /api/auth/register:', err)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
