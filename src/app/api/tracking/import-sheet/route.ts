import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-server'
import { query } from '@/lib/sql'
import * as xlsx from 'xlsx'

/** Convierte fecha en formato DD/MM/YYYY a un objeto Date (solo fecha, sin hora) */
function parseDMY(str: string): Date | null {
    const parts = str.split('/')
    if (parts.length !== 3) return null
    const [d, m, y] = parts
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`)
    return isNaN(date.getTime()) ? null : date
}

// ID del Google Sheet (prioriza env variable específica para Tracking)
const SHEET_ID = process.env.TRACKING_SHEET_ID || '1QwWUe34Yn0BnTfb8WckxzDRmEKJfuATPse9g76VM3n8'

export async function GET(request: NextRequest) {
    // LOGIN TEMPORALMENTE DESACTIVADO
    // const user = await getSessionUser()
    // if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const warehouse = searchParams.get('warehouse')

    if (!warehouse) {
        return NextResponse.json({ error: 'Warehouse parameter is required' }, { status: 400 })
    }

    try {
        // Obtenemos los datos del CSV exportado del Sheet
        const response = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`)
        if (!response.ok) {
            throw new Error(`Failed to fetch sheet: ${response.statusText}`)
        }

        const csvText = await response.text()
        const workbook = xlsx.read(csvText, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as string[][]

        if (data.length < 2) {
            return NextResponse.json([])
        }

        const parsedRows = data.slice(1)

        // Fecha (Col A=0) | Transporte (Col B=1) | Retira (Col O=14)?? | Patente (Col D=3) | Deposito (Col J=9) | Viaje (Col M=12) | Cliente (Col O=14)

        // Let's check headers indexes based on the curl output
        /**
         * fecha (0)
         * transporte (1)
         * vehiculo (2)
         * patente (3)
         * tipo (4)
         * metros (5)
         * palletizado (6)
         * vuelta (7)
         * ruta (8)
         * deposito (9)
         * viaje (10)
         * orden_de_carga (11)
         * numero de viaje (12)
         * acompanante (13)
         * cliente (14)
         * turno_en_el_cliente (15)
         * observaciones (16)
         */

        const trips = []

        // Fecha de hoy a medianoche (sin hora) para comparar >= hoy
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        // Consultar trip_numbers ya existentes en la DB para este warehouse (excluyendo borrados)
        let existingTripNumbers = new Set<string>()
        try {
            const existingRows = await query<{ trip_number: string }>(
                `SELECT DISTINCT trip_number FROM tracking_trips WHERE warehouse = $1 AND status != 'deleted' AND trip_number IS NOT NULL AND trip_number != ''`,
                [warehouse]
            )
            existingTripNumbers = new Set(existingRows.map(r => r.trip_number))
        } catch (dbError) {
            console.error("Database connection error in import-sheet:", dbError)
            // Continue without DB filtering if DB is not available
        }

        for (const cols of parsedRows) {
            if (!cols || cols.length < 15) continue; // Skip incomplete rows

            // Campo Tracking      Columna Sheet
            // ------------------|--------------
            // Fecha             | A (0)
            // Viaje             | M (12)
            // Transporte        | B (1)
            // Retira            | O (14)
            // Patente           | D (3)
            // Depósito          | J (9)

            let fecha = cols[0] ? String(cols[0]).trim() : ''
            const transporte = cols[1] ? String(cols[1]).trim() : ''
            const patente = cols[3] ? String(cols[3]).trim() : ''
            const deposito = cols[9] ? String(cols[9]).trim() : ''
            const numeroViaje = cols[12] ? String(cols[12]).trim() : ''
            const retira = cols[14] ? String(cols[14]).trim() : '' // Col O = cliente/retira

            // Normalizar fecha a DD/MM/YYYY
            if (fecha.includes('/')) {
                const parts = fecha.split('/')
                if (parts.length === 3) {
                    const [d, m, y] = parts
                    fecha = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
                }
            }

            if (deposito.toUpperCase() !== warehouse.toUpperCase()) continue;

            // Solo viajes desde hoy en adelante (>= hoy)
            const fechaDate = parseDMY(fecha)
            if (!fechaDate || fechaDate < todayStart) {
                // console.log(`[import-sheet] Skipping old/invalid date: ${fecha}`)
                continue;
            }

            // Saltar si el número de viaje ya existe en la DB
            if (!numeroViaje || existingTripNumbers.has(numeroViaje)) continue;

            // Determine trip type: B2C si la columna O comienza con "B2C"
            const isB2C = retira.toUpperCase().startsWith('B2C')

            // Convertir fecha del sheet a formato ISO para la DB (YYYY-MM-DD)
            const parts = fecha.split('/')
            const fechaISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`

            trips.push({
                trip_type: isB2C ? 'b2c' : 'b2b',
                date: fechaISO,
                carrier: transporte,
                retira: retira,
                client: retira,
                vehicle_plate: patente,
                trip_number: numeroViaje,
                port: '',
                pallets: 0,
                task_count: 0
            })

            if (trips.length >= 100) break;
        }

        console.log(`[import-sheet] SUCCESS: Found ${trips.length} trips for ${warehouse}`)
        return NextResponse.json(trips)

    } catch (error) {
        console.error("Error importing sheet:", error)
        return NextResponse.json({ error: 'Failed to import sheet' }, { status: 500 })
    }
}
