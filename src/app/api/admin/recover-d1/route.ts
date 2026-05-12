import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const date = '2026-05-11';
    
    // Specific values requested by the user
    const bultos_b2c = 1736;
    const bultos_b2b = 1635;
    
    // Values from previous snapshot/screenshot to maintain consistency
    const despachados_bultos = 1632;
    const camiones_desp_b2b = 25;
    const devoluciones = 131;
    const incidencias = 0;
    
    // Keep ingresados from my previous calculation as they weren't explicitly changed
    const ingresados = 751;
    const ing_reti_meli = 0;
    const ing_andreani = 57;
    const ing_flota_propia = 452;
    const ing_otros = 242;

    const sql = `
      INSERT INTO evento_kpi_snapshots (
        date, bultos_b2c, bultos_b2b, despachados_bultos, camiones_desp_b2b, 
        devoluciones, ingresados, ing_reti_meli, ing_andreani, ing_flota_propia, ing_otros,
        incidencias, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
      ) ON CONFLICT (date) DO UPDATE SET
        bultos_b2c = EXCLUDED.bultos_b2c,
        bultos_b2b = EXCLUDED.bultos_b2b,
        despachados_bultos = EXCLUDED.despachados_bultos,
        camiones_desp_b2b = EXCLUDED.camiones_desp_b2b,
        devoluciones = EXCLUDED.devoluciones,
        ingresados = EXCLUDED.ingresados,
        ing_reti_meli = EXCLUDED.ing_reti_meli,
        ing_andreani = EXCLUDED.ing_andreani,
        ing_flota_propia = EXCLUDED.ing_flota_propia,
        ing_otros = EXCLUDED.ing_otros,
        incidencias = EXCLUDED.incidencias,
        updated_at = NOW();
    `;

    await client.query(sql, [
      date, bultos_b2c, bultos_b2b, despachados_bultos, camiones_desp_b2b, 
      devoluciones, ingresados, ing_reti_meli, ing_andreani, ing_flota_propia, ing_otros,
      incidencias
    ]);

    return NextResponse.json({ 
      success: true, 
      message: `Data recovered for ${date} with B2C: ${bultos_b2c}, B2B: ${bultos_b2b}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: String(error), stack: error.stack }, { status: 500 });
  } finally {
    await client.end().catch(console.error);
  }
}
