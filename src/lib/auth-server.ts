/**
 * Server-only auth helpers — JWT + SQL Server.
 * Never import this in client components.
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { AppUser, TabPermission, UserRole, UserStatus } from '@/types'
import { getPool, sql } from './sql'

const COOKIE_NAME = 'session'
const JWT_EXPIRY = '7d'

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET env var is not set')
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
        maxAge: 60 * 60 * 24 * 7, // 7 days
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
        const pool = await getPool()
        const result = await pool.request()
            .input('id', sql.UniqueIdentifier, id)
            .query<DbUser>('SELECT id, email, name, role, status, tabs FROM users WHERE id = @id')

        const row = result.recordset[0]
        if (!row) return null
        return dbRowToAppUser(row)
    } catch {
        return null
    }
}

export async function getUserByEmail(email: string): Promise<(DbUser) | null> {
    try {
        const pool = await getPool()
        const result = await pool.request()
            .input('email', sql.NVarChar, email.toLowerCase())
            .query<DbUser>('SELECT id, email, name, password_hash, role, status, tabs FROM users WHERE email = @email')
        return result.recordset[0] ?? null
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
        password: '', // never expose hash to client
        role: row.role,
        status: row.status,
        tabs,
        createdAt: '',
    }
}
