import { Pool, type PoolClient } from 'pg'

// Railway provides DATABASE_URL automatically when a Postgres service is linked
if (!process.env.DATABASE_URL) {
    console.warn('⚠️ ADVERTENCIA: DATABASE_URL no está definida en el entorno. Las operaciones de base de datos fallarán.')
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    max: 10,
    idleTimeoutMillis: 30000,
})

export async function getPool(): Promise<Pool> {
    return pool
}

/** Run a parameterized query. Parameters use $1, $2, ... notation. */
export async function query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<T[]> {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined. Please check your .env.local file.')
    }
    const result = await pool.query(text, params)
    return result.rows as T[]
}

export { pool }
export type { PoolClient }
