import { NextRequest, NextResponse } from 'next/server'
import { getOcupacion } from '@/lib/ocupacion-source'
import type { Planta } from '@/types/ocupacion'

function parsePlanta(value: string | null): Planta | null {
    if (value === 'pl2' || value === 'pl3') return value
    return null
}

export async function GET(request: NextRequest) {
    const planta = parsePlanta(request.nextUrl.searchParams.get('planta'))
    if (!planta) {
        return NextResponse.json({ error: 'planta must be pl2 or pl3' }, { status: 400 })
    }

    try {
        const data = await getOcupacion(planta)
        return NextResponse.json(data)
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
