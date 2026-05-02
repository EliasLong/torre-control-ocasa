import { NextResponse } from 'next/server';
import { getEventoData } from '@/app/api/evento/kpis/route';
import { query } from '@/lib/sql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch current metrics
    const data = await getEventoData();

    // 2. Identify "today" date key
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dateKey = `${dd}/${mm}`;
    
    // YYYY-MM-DD for PostgreSQL DATE column
    const yyyy = today.getFullYear();
    const sqlDate = `${yyyy}-${mm}-${dd}`;

    const todayKPIs = data.byDay[dateKey];
    if (!todayKPIs) {
      return NextResponse.json({ error: 'No data found for today' }, { status: 400 });
    }

    // 3. Upsert into database
    const sql = `
      INSERT INTO evento_kpi_snapshots (
        date, bultos_b2c, bultos_b2b, pallets_b2c, pallets_b2b, 
        trips_b2c, trips_b2b, despachados_bultos, camiones_desp_b2b, 
        devoluciones, ingresados, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
      ) ON CONFLICT (date) DO UPDATE SET
        bultos_b2c = EXCLUDED.bultos_b2c,
        bultos_b2b = EXCLUDED.bultos_b2b,
        pallets_b2c = EXCLUDED.pallets_b2c,
        pallets_b2b = EXCLUDED.pallets_b2b,
        trips_b2c = EXCLUDED.trips_b2c,
        trips_b2b = EXCLUDED.trips_b2b,
        despachados_bultos = EXCLUDED.despachados_bultos,
        camiones_desp_b2b = EXCLUDED.camiones_desp_b2b,
        devoluciones = EXCLUDED.devoluciones,
        ingresados = EXCLUDED.ingresados,
        updated_at = NOW();
    `;

    await query(sql, [
      sqlDate,
      todayKPIs.bultosB2C,
      todayKPIs.bultosB2B,
      todayKPIs.palletsB2C,
      todayKPIs.palletsB2B,
      todayKPIs.tripsB2C,
      todayKPIs.tripsB2B,
      todayKPIs.despachadosBultos,
      todayKPIs.camionesDespB2B,
      todayKPIs.devoluciones,
      todayKPIs.ingresados
    ]);

    return NextResponse.json({ success: true, message: `Snapshot saved for ${sqlDate}` });
  } catch (error: any) {
    console.error('Snapshot error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
