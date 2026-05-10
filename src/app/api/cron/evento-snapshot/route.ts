import { NextResponse } from 'next/server';
import { getEventoData, fetchSheetRows, SHEETS } from '@/app/api/evento/kpis/route';
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

    // 3. Save full backup of the Ingresados sheet
    // We fetch all rows from both ING sheets to satisfy "store the whole sheet"
    const [pl2ing, pl3ing] = await Promise.all([
      fetchSheetRows(SHEETS.PL2_INGRESADOS.id, SHEETS.PL2_INGRESADOS.gid, 'ING'),
      fetchSheetRows(SHEETS.PL3_INGRESADOS.id, SHEETS.PL3_INGRESADOS.gid, 'ING'),
    ]);
    const allIngRows = [...pl2ing, ...pl3ing];

    await query(`
      INSERT INTO evento_ingresados_backups (date, data, snapshot_time)
      VALUES ($1, $2, NOW())
      ON CONFLICT (date) DO NOTHING;
    `, [sqlDate, JSON.stringify(allIngRows)]);

    // 4. Upsert into database (KPIs)
    // CASE WHEN logic: only update a field if the new value is > 0.
    const sql = `
      INSERT INTO evento_kpi_snapshots (
        date, bultos_b2c, bultos_b2b, pallets_b2c, pallets_b2b, 
        trips_b2c, trips_b2b, despachados_bultos, camiones_desp_b2b, 
        devoluciones, ingresados, ingresados_flota, 
        ing_reti_meli, ing_andreani, ing_flota_propia, ing_otros,
        incidencias, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
      ) ON CONFLICT (date) DO UPDATE SET
        bultos_b2c         = CASE WHEN EXCLUDED.bultos_b2c         > 0 THEN EXCLUDED.bultos_b2c         ELSE evento_kpi_snapshots.bultos_b2c         END,
        bultos_b2b         = CASE WHEN EXCLUDED.bultos_b2b         > 0 THEN EXCLUDED.bultos_b2b         ELSE evento_kpi_snapshots.bultos_b2b         END,
        pallets_b2c        = CASE WHEN EXCLUDED.pallets_b2c        > 0 THEN EXCLUDED.pallets_b2c        ELSE evento_kpi_snapshots.pallets_b2c        END,
        pallets_b2b        = CASE WHEN EXCLUDED.pallets_b2b        > 0 THEN EXCLUDED.pallets_b2b        ELSE evento_kpi_snapshots.pallets_b2b        END,
        trips_b2c          = CASE WHEN EXCLUDED.trips_b2c          > 0 THEN EXCLUDED.trips_b2c          ELSE evento_kpi_snapshots.trips_b2c          END,
        trips_b2b          = CASE WHEN EXCLUDED.trips_b2b          > 0 THEN EXCLUDED.trips_b2b          ELSE evento_kpi_snapshots.trips_b2b          END,
        despachados_bultos = CASE WHEN EXCLUDED.despachados_bultos > 0 THEN EXCLUDED.despachados_bultos ELSE evento_kpi_snapshots.despachados_bultos END,
        camiones_desp_b2b  = CASE WHEN EXCLUDED.camiones_desp_b2b  > 0 THEN EXCLUDED.camiones_desp_b2b  ELSE evento_kpi_snapshots.camiones_desp_b2b  END,
        devoluciones       = CASE WHEN EXCLUDED.devoluciones       > 0 THEN EXCLUDED.devoluciones       ELSE evento_kpi_snapshots.devoluciones       END,
        -- Ingresados: Only update if current value is 0 (first run of the day)
        ingresados         = CASE WHEN evento_kpi_snapshots.ingresados = 0 THEN EXCLUDED.ingresados ELSE evento_kpi_snapshots.ingresados END,
        ingresados_flota   = CASE WHEN evento_kpi_snapshots.ingresados_flota = 0 THEN EXCLUDED.ingresados_flota ELSE evento_kpi_snapshots.ingresados_flota END,
        ing_reti_meli      = CASE WHEN evento_kpi_snapshots.ing_reti_meli = 0 THEN EXCLUDED.ing_reti_meli ELSE evento_kpi_snapshots.ing_reti_meli END,
        ing_andreani       = CASE WHEN evento_kpi_snapshots.ing_andreani = 0 THEN EXCLUDED.ing_andreani ELSE evento_kpi_snapshots.ing_andreani END,
        ing_flota_propia   = CASE WHEN evento_kpi_snapshots.ing_flota_propia = 0 THEN EXCLUDED.ing_flota_propia ELSE evento_kpi_snapshots.ing_flota_propia END,
        ing_otros          = CASE WHEN evento_kpi_snapshots.ing_otros = 0 THEN EXCLUDED.ing_otros ELSE evento_kpi_snapshots.ing_otros END,
        incidencias        = CASE WHEN EXCLUDED.incidencias        > 0 THEN EXCLUDED.incidencias        ELSE evento_kpi_snapshots.incidencias        END,
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
      data.volumenRetiMeli + data.volumenAndreani + data.volumenFlotaPropia + data.volumenOtros,
      data.volumenFlotaPropia,
      data.volumenRetiMeli,
      data.volumenAndreani,
      data.volumenFlotaPropia,
      data.volumenOtros,
      todayKPIs.incidencias
    ]);

    return NextResponse.json({ success: true, message: `Snapshot and backup saved for ${sqlDate}` });
  } catch (error: any) {
    console.error('Snapshot error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
