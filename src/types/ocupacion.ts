export type Planta = 'pl2' | 'pl3'

export interface SectorData {
    pallets: number
    pct: number
    capM2: number
    m2Ocupados: number
}

export interface OcupacionKPIs {
    ocupacionGlobal: number
    palletsOcupados: number
    m2Ocupados: number
    sectoresCriticos: number
}

export interface OcupacionData {
    planta: Planta
    sectores: Record<string, SectorData>
    kpis: OcupacionKPIs
    fechaActualizacion: string
}
