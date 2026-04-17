import type { CamionMovimiento } from '@/types'

const DOCK_V4_URL = process.env.DOCK_V4_URL ?? 'https://dock-manager-ocasa-pilar.up.railway.app'

interface DockTurno {
    id: number
    turno_id: string
    truck: string
    carrier: string
    type: 'INBOUND' | 'OUTBOUND'
    warehouse: string
    dock: string | null
    status: string
    ts_entrada: string | null
    ts_egreso: string | null
    contenedor: string | null
    chofer?: string
}

/** Extrae YYYY-MM-DD y HH:MM en zona horaria America/Argentina/Buenos_Aires */
function splitTimestamp(iso: string | null): { fecha: string | null; hora: string | null } {
    if (!iso) return { fecha: null, hora: null }
    const d = new Date(iso)
    if (isNaN(d.getTime())) return { fecha: null, hora: null }

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d)

    const get = (t: string) => parts.find(p => p.type === t)?.value ?? ''
    const fecha = `${get('year')}-${get('month')}-${get('day')}`
    const hh = get('hour').padStart(2, '0').replace('24', '00')
    const mm = get('minute').padStart(2, '0')
    const hora = `${hh}:${mm}`
    return { fecha, hora }
}

function mapTurno(t: DockTurno): CamionMovimiento {
    const entrada = splitTimestamp(t.ts_entrada)
    const egreso = splitTimestamp(t.ts_egreso)
    return {
        patente: t.truck ?? '',
        contenedor: t.contenedor ?? null,
        empresa: t.carrier ?? '',
        fechaIngreso: entrada.fecha ?? '',
        horaIngreso: entrada.hora,
        fechaEgreso: egreso.fecha,
        horaEgreso: egreso.hora,
        estado: egreso.fecha ? 'egresado' : 'en_predio',
    }
}

export async function getCamionesDelDia(fecha: string): Promise<CamionMovimiento[]> {
    const url = `${DOCK_V4_URL}/api/turnos`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
        throw new Error(`dock-v4 /api/turnos (${res.status})`)
    }
    const data = await res.json() as { success: boolean; turnos: DockTurno[] }
    if (!data.success) throw new Error('dock-v4 response success=false')

    return data.turnos
        .map(mapTurno)
        .filter(c => c.fechaIngreso === fecha)
}
