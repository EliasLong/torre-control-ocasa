import { NextResponse } from 'next/server'

const INVENTARIO_APP_URL = process.env.INVENTARIO_APP_URL

export async function GET() {
    if (!INVENTARIO_APP_URL) {
        return NextResponse.json(
            { error: 'INVENTARIO_APP_URL no configurada' },
            { status: 503 }
        )
    }

    try {
        const res = await fetch(`${INVENTARIO_APP_URL}/api/ira`, {
            next: { revalidate: 120 },
        })
        if (!res.ok) {
            return NextResponse.json(
                { error: `inventario-app (${res.status})` },
                { status: 502 }
            )
        }
        const data = await res.json()
        return NextResponse.json(data)
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 502 }
        )
    }
}
