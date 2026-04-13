import sql from 'mssql'

// Connection string format: sqlserver://user:password@host:port;database=dbname
// Or use individual env vars
const config: sql.config = {
    server: process.env.MSSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MSSQL_PORT ?? '1433'),
    database: process.env.MSSQL_DATABASE ?? 'ocasa',
    user: process.env.MSSQL_USER ?? 'sa',
    password: process.env.MSSQL_PASSWORD ?? '',
    options: {
        encrypt: process.env.MSSQL_ENCRYPT !== 'false',
        trustServerCertificate: process.env.MSSQL_TRUST_CERT === 'true',
        enableArithAbort: true,
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
}

// Singleton pool — reused across requests in the same process
let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
    if (pool && pool.connected) return pool
    pool = await new sql.ConnectionPool(config).connect()
    return pool
}

export { sql }
