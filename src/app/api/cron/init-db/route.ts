import { NextResponse } from 'next/server';
import { query } from '@/lib/sql';

export async function GET() {
  try {
    // ── Tabla principal de snapshots KPI (un registro por día) ──
    await query(`
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
          ingresados_flota    INTEGER     NOT NULL DEFAULT 0,
          ing_reti_meli       INTEGER     NOT NULL DEFAULT 0,
          ing_andreani        INTEGER     NOT NULL DEFAULT 0,
          ing_flota_propia    INTEGER     NOT NULL DEFAULT 0,
          ing_otros           INTEGER     NOT NULL DEFAULT 0,
          incidencias         INTEGER     NOT NULL DEFAULT 0,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── Migraciones seguras: agrega columnas si ya existe la tabla ──
    await query(`ALTER TABLE evento_kpi_snapshots ADD COLUMN IF NOT EXISTS ing_reti_meli    INTEGER NOT NULL DEFAULT 0;`);
    await query(`ALTER TABLE evento_kpi_snapshots ADD COLUMN IF NOT EXISTS ing_andreani     INTEGER NOT NULL DEFAULT 0;`);
    await query(`ALTER TABLE evento_kpi_snapshots ADD COLUMN IF NOT EXISTS ing_flota_propia INTEGER NOT NULL DEFAULT 0;`);
    await query(`ALTER TABLE evento_kpi_snapshots ADD COLUMN IF NOT EXISTS ing_otros        INTEGER NOT NULL DEFAULT 0;`);

    // ── Historial granular de picking: guarda CADA captura con timestamp ──
    // Esto evita que un cron con valor 0 sobreescriba datos correctos del día.
    await query(`
      CREATE TABLE IF NOT EXISTS evento_pick_history (
          id              BIGSERIAL   PRIMARY KEY,
          date            DATE        NOT NULL,
          bultos_b2c      INTEGER     NOT NULL DEFAULT 0,
          bultos_b2b      INTEGER     NOT NULL DEFAULT 0,
          source          VARCHAR(30) NOT NULL DEFAULT 'cron_hourly',
          captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_pick_history_date
          ON evento_pick_history (date DESC);
    `);

    // ── Respaldo de la hoja Ingresados (JSON completo) ──
    await query(`
      CREATE TABLE IF NOT EXISTS evento_ingresados_backups (
          date            DATE        NOT NULL PRIMARY KEY,
          data            JSONB       NOT NULL DEFAULT '[]',
          snapshot_time   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'All tables created/migrated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: String(error), stack: error.stack }, { status: 500 });
  }
}
