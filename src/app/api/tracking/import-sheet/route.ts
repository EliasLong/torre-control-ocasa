import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth-server'
import { query } from '@/lib/sql'
import * as xlsx from 'xlsx'

// ID del Google Sheet: 1QwWUe34Yn0BnTfb8WckxzDRmEKJfuATPse9g76VM3n8
const SHEET_ID = '1QwWUe34Yn0BnTfb8WckxzDRmEKJfuATPse9g76VM3n8'

export async function GET(request: NextRequest) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

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

        // Calculate today's date in 'DD/MM/YYYY' format to match sheet
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        const todayStr = `${dd}/${mm}/${yyyy}`

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
            const retira = cols[14] ? String(cols[14]).trim() : '' // Col O es Cliente/Retira

            if (fecha.includes('/')) {
                const parts = fecha.split('/')
                if (parts.length === 3) {
                    const [d, m, y] = parts
                    fecha = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
                }
            }

            if (deposito.toUpperCase() !== warehouse.toUpperCase()) continue;

            // Only today's trips
            if (fecha !== todayStr) continue;

            // Determine if B2C based on Cliente (Column O / 14)
            const isB2C = retira.toUpperCase() === 'B2C'

            trips.push({
                trip_type: isB2C ? 'b2c' : 'b2b',
                date: new Date().toISOString(),
                carrier: transporte,
                retira: retira,
                client: retira,
                vehicle_plate: patente,
                trip_number: numeroViaje,
                port: '',
                pallets: 0,
                task_count: 0
            })
        }

        return NextResponse.json(trips)

    } catch (error) {
        console.error("Error importing sheet:", error)
        return NextResponse.json({ error: 'Failed to import sheet' }, { status: 500 })
    }
}
