/**
 * Server-only auth helpers — JWT + PostgreSQL.
 * Never import this in client components.
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { AppUser, TabPermission, UserRole, UserStatus } from '@/types'
import { query } from './sql'

const COOKIE_NAME = 'session'
const JWT_EXPIRY = '7d'

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
    return new TextEncoder().encode(secret)
}

// ----------------------------------------------------------------
// JWT helpers
// ----------------------------------------------------------------

export async function createSessionToken(userId: string): Promise<string> {
    return new SignJWT({ sub: userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRY)
        .sign(getJwtSecret())
}

export async function verifySessionToken(token: string): Promise<string | null> {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret())
        return payload.sub ?? null
    } catch {
        return null
    }
}

// ----------------------------------------------------------------
// Cookie helpers
// ----------------------------------------------------------------

export async function setSessionCookie(token: string): Promise<void> {
    const store = await cookies()
    store.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    })
}

export async function clearSessionCookie(): Promise<void> {
    const store = await cookies()
    store.delete(COOKIE_NAME)
}

export async function getSessionCookie(): Promise<string | null> {
    const store = await cookies()
    return store.get(COOKIE_NAME)?.value ?? null
}

// ----------------------------------------------------------------
// DB user helpers
// ----------------------------------------------------------------

interface DbUser {
    id: string
    email: string
    name: string
    password_hash: string
    role: UserRole
    status: UserStatus
    tabs: string
}

export async function getUserById(id: string): Promise<AppUser | null> {
    try {
        const rows = await query<DbUser>(
            'SELECT id, email, name, role, status, tabs FROM users WHERE id = $1',
            [id]
        )
        if (!rows[0]) return null
        return dbRowToAppUser(rows[0])
    } catch {
        return null
    }
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
    try {
        const rows = await query<DbUser>(
            'SELECT id, email, name, password_hash, role, status, tabs FROM users WHERE email = $1',
            [email.toLowerCase()]
        )
        return rows[0] ?? null
    } catch {
        return null
    }
}

// ----------------------------------------------------------------
// Session resolution
// ----------------------------------------------------------------

export async function getSessionUser(): Promise<AppUser | null> {
    const token = await getSessionCookie()
    if (!token) return null
    const userId = await verifySessionToken(token)
    if (!userId) return null
    return getUserById(userId)
}

// ----------------------------------------------------------------
// Converters
// ----------------------------------------------------------------

function dbRowToAppUser(row: DbUser): AppUser {
    let tabs: TabPermission[] = []
    try { tabs = JSON.parse(row.tabs) } catch {}
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        password: '',
        role: row.role,
        status: row.status,
        tabs,
        createdAt: '',
    }
}
