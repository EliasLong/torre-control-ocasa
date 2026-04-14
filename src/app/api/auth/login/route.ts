import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUserByEmail, createSessionToken, setSessionCookie } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json() as { email: string; password: string }

        if (!email || !password) {
            return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
        }

        const user = await getUserByEmail(email)
        if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })

        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })

        if (user.status === 'pending') return NextResponse.json({ error: 'Tu cuenta está pendiente de aprobación' }, { status: 403 })
        if (user.status === 'rejected') return NextResponse.json({ error: 'Tu cuenta fue rechazada. Contactá al administrador' }, { status: 403 })

        const token = await createSessionToken(user.id)
        await setSessionCookie(token)

        let tabs: string[] = []
        try { tabs = JSON.parse(user.tabs) } catch {}

        return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, tabs })
    } catch (err) {
        console.error('POST /api/auth/login:', err)
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
