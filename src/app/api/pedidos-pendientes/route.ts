import { NextRequest, NextResponse } from 'next/server'

const SHEET_ID = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'
const GID: Record<'pl2' | 'pl3', number> = { pl2: 0, pl3: 1150456694 }

const MESES: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
}

function parseVtoDate(s: string): Date | null {
    if (!s) return null
    const parts = s.toLowerCase().trim().split(' ')
    if (parts.length >= 3) {
        const day = parseInt(parts[0])
        const month = MESES[parts[1]] ?? -1
        const year = parseInt(parts[2])
        if (!isNaN(day) && !isNaN(year) && month >= 0) return new Date(year, month, day)
    }
    if (s.includes('/') || s.includes('-')) {
        const sep = s.includes('/') ? '/' : '-'
        const p = s.split(sep).map(Number)
        if (p.length === 3) {
            if (p[2] > 1000) return new Date(p[2], p[1] - 1, p[0])
            if (p[0] > 1000) return new Date(p[0], p[1] - 1, p[2])
        }
    }
    return null
}

function semaforo(vto: string): 'verde' | 'amarillo' | 'rojo' {
    const d = parseVtoDate(vto)
    if (!d) return 'verde'
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return 'verde'
    if (diff <= 2) return 'amarillo'
    return 'rojo'
}

async function fetchPlanta(planta: 'pl2' | 'pl3') {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${GID[planta]}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`sheet ${planta} (${res.status})`)
    const csv = await res.text()
    const rows = csv.split('\n').filter(r => r.trim())
    if (rows.length < 2) return { total: 0, vencidos: 0, amarillo: 0, rojo: 0 }

    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const iTransp = headers.findIndex(h => h === 'Transporte')
    const iVto = headers.findIndex(h => h === 'Vto Pedido' || h === 'Vto pedido' || h === 'Vto OC')

    let total = 0, amarillo = 0, rojo = 0
    for (const row of rows.slice(1)) {
        const cells = row.split(',').map(c => c.trim().replace(/"/g, ''))
        const transp = (cells[iTransp] ?? '').toUpperCase()
        if (transp === 'FLOTA PROPIA CON COORDINACION' || transp === 'S/A' || !transp) continue
        total++
        const s = semaforo(cells[iVto] ?? '')
        if (s === 'amarillo') amarillo++
        else if (s === 'rojo') rojo++
    }
    return { total, vencidos: amarillo + rojo, amarillo, rojo }
}

export async function GET(request: NextRequest) {
    try {
        const plantaParam = request.nextUrl.searchParams.get('planta')
        if (plantaParam === 'pl2' || plantaParam === 'pl3') {
            const data = await fetchPlanta(plantaParam)
            return NextResponse.json({ planta: plantaParam, ...data })
        }

        const [pl2, pl3] = await Promise.all([fetchPlanta('pl2'), fetchPlanta('pl3')])
        return NextResponse.json({
            total: pl2.total + pl3.total,
            vencidos: pl2.vencidos + pl3.vencidos,
            amarillo: pl2.amarillo + pl3.amarillo,
            rojo: pl2.rojo + pl3.rojo,
            pl2,
            pl3,
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
