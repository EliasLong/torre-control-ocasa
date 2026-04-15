import type { OcupacionData, OcupacionKPIs, Planta, SectorData } from '@/types/ocupacion'

const SHEET_OCUPACION = '1g8GSxfdGMjMy-6fXtzbc6HkB64CiVkcvMoKcBUl_uMw'
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY!

export const CAPACIDAD_M2_POR_SECTOR = 487

const CRITICAL_THRESHOLD_PCT = 90

interface RawRow {
    subinventario: string
    localizador: string
    pallets: number
    superficieM2: number
    tipo: string
}

async function fetchSheet(planta: Planta): Promise<string[][]> {
    const tab = `'${planta.toUpperCase()}'`
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_OCUPACION}/values/${encodeURIComponent(tab)}?key=${API_KEY}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
        const body = await res.text()
        throw new Error(`Google Sheets API (${res.status}): ${body}`)
    }
    const data = await res.json()
    return (data.values as string[][]) ?? []
}

function toNumber(raw: string | undefined): number {
    if (!raw) return 0
    const normalized = raw.trim().replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')
    const n = Number(normalized)
    return Number.isFinite(n) ? n : 0
}

function parseRows(sheet: string[][]): RawRow[] {
    if (sheet.length < 2) return []
    const headers = sheet[0].map(h => h.trim().toLowerCase())
    const idxSub = headers.indexOf('subinventario')
    const idxLoc = headers.indexOf('localizador')
    const idxPallets = headers.indexOf('pallets')
    const idxM2 = headers.indexOf('superficie_m2')
    const idxTipo = headers.indexOf('tipo')

    return sheet.slice(1)
        .filter(row => row.some(cell => cell?.trim() !== ''))
        .map(row => ({
            subinventario: (row[idxSub] ?? '').trim().toUpperCase(),
            localizador: (row[idxLoc] ?? '').trim(),
            pallets: toNumber(row[idxPallets]),
            superficieM2: toNumber(row[idxM2]),
            tipo: (row[idxTipo] ?? '').trim().toUpperCase(),
        }))
}

function extractSector(localizador: string): string | null {
    if (!localizador) return null
    const sector = localizador.split('.')[0]?.trim().toUpperCase() ?? ''
    // Sector válido: letra + 2 dígitos (ej. A16, B09)
    return /^[A-Z]\d{2}$/.test(sector) ? sector : null
}

export function aggregateBySector(rows: RawRow[]): Record<string, SectorData> {
    const acc: Record<string, { pallets: number; m2: number }> = {}

    for (const r of rows) {
        if (r.subinventario !== 'ALMACEN' || r.tipo !== 'OK') continue
        const sector = extractSector(r.localizador)
        if (!sector) continue
        if (!acc[sector]) acc[sector] = { pallets: 0, m2: 0 }
        acc[sector].pallets += r.pallets
        acc[sector].m2 += r.superficieM2
    }

    const out: Record<string, SectorData> = {}
    for (const [sector, { pallets, m2 }] of Object.entries(acc)) {
        const pct = (m2 / CAPACIDAD_M2_POR_SECTOR) * 100
        out[sector] = {
            pallets: Math.round(pallets),
            m2Ocupados: Math.round(m2 * 100) / 100,
            capM2: CAPACIDAD_M2_POR_SECTOR,
            pct: Math.round(pct * 10) / 10,
        }
    }
    return out
}

export function computeKpis(sectores: Record<string, SectorData>): OcupacionKPIs {
    const entries = Object.values(sectores)
    const totalCap = entries.length * CAPACIDAD_M2_POR_SECTOR
    const totalM2 = entries.reduce((sum, s) => sum + s.m2Ocupados, 0)
    const totalPallets = entries.reduce((sum, s) => sum + s.pallets, 0)
    const criticos = entries.filter(s => s.pct >= CRITICAL_THRESHOLD_PCT).length

    return {
        ocupacionGlobal: totalCap === 0 ? 0 : Math.round((totalM2 / totalCap) * 1000) / 10,
        palletsOcupados: totalPallets,
        m2Ocupados: Math.round(totalM2),
        sectoresCriticos: criticos,
    }
}

export async function debugFetch(planta: Planta) {
    const raw = await fetchSheet(planta)
    const headers = raw[0] ?? []
    const sampleRow = raw[1] ?? []
    const totalRows = raw.length
    const rows = parseRows(raw)
    const almacenOk = rows.filter(r => r.subinventario === 'ALMACEN' && r.tipo === 'OK')
    const uniqueSubs = [...new Set(rows.map(r => r.subinventario))]
    const uniqueTipos = [...new Set(rows.map(r => r.tipo))]
    const sectores = aggregateBySector(rows)
    return {
        apiKeyPresent: Boolean(API_KEY),
        totalRows,
        headers,
        sampleRow,
        parsedRows: rows.length,
        uniqueSubs,
        uniqueTipos,
        almacenOkCount: almacenOk.length,
        sampleParsed: rows.slice(0, 3),
        sampleAlmacenOk: almacenOk.slice(0, 3),
        sectorCount: Object.keys(sectores).length,
        sectoresSample: Object.entries(sectores).slice(0, 3),
    }
}

export async function getOcupacion(planta: Planta): Promise<OcupacionData> {
    const raw = await fetchSheet(planta)
    const rows = parseRows(raw)
    const sectores = aggregateBySector(rows)
    const kpis = computeKpis(sectores)
    return {
        planta,
        sectores,
        kpis,
        fechaActualizacion: new Date().toISOString(),
    }
}
