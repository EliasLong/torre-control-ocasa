import { NextResponse } from 'next/server';
import { query } from '@/lib/sql';

export async function GET() {
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS evento_kpi_snapshots (
          date                DATE        NOT NULL PRIMARY KEY,
          bultos_b2c          INTEGER     NOT NULL DEFAULT 0,
          bultos_b2b          INTEGER     NOT NULL DEFAULT 0,
          pallets_b2c         INTEGER     NOT NULL DEFAULT 0,
          pallets_b2b         INTEGER     NOT NULL DEFAULT 0,
          trips_b2c           INTEGER     NOT NULL DEFAULT 0,
          trips_b2b           INTEGER     NOT NULL DEFAULT 0,
          despachados_bultos  INTEGER     NOT NULL DEFAULT 0,
          camiones_desp_b2b   INTEGER     NOT NULL DEFAULT 0,
          devoluciones        INTEGER     NOT NULL DEFAULT 0,
          ingresados          INTEGER     NOT NULL DEFAULT 0,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await query(sql);
    return NextResponse.json({ success: true, message: 'Table created successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: String(error), stack: error.stack }, { status: 500 });
  }
}
