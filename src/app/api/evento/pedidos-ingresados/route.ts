import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/sql';

// ── Sheet config (same IDs as kpis/route.ts) ───────────────────────────────
const SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY';
const ING_SHEETS = [
  { id: SPREADSHEET_INGRESADOS, gid: '0',          label: 'PL2' },
  { id: SPREADSHEET_INGRESADOS, gid: '1150456694', label: 'PL3' },
];

// ── Event window: 04/05/2026 – 11/05/2026 ─────────────────────────────────
const EVENT_START = '2026-05-04';
const EVENT_END   = '2026-05-11';

function csvUrl(id: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function parseCsv(text: string): string[][] {
  // Simple CSV split (handles quoted commas poorly for complex data, but adequate here)
  return text
    .split(/\r?\n/)
    .filter(l => l.trim() !== '')
    .map(line => {
      const cols: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { cols.push(current); current = ''; }
        else { current += ch; }
      }
      cols.push(current);
      return cols;
    });
}

// ── Ensure table exists ────────────────────────────────────────────────────
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS evento_pedidos_ingresados (
      nro_pedido   VARCHAR(100) NOT NULL PRIMARY KEY,
      cantidad     INTEGER      NOT NULL DEFAULT 0,
      evento_start VARCHAR(10)  NOT NULL,
      created_at   TIMESTAMP    DEFAULT NOW()
    )
  `);
  // Ensure the table has the evento_start column (in case it was created in an older version)
  try {
    await query(`ALTER TABLE evento_pedidos_ingresados ADD COLUMN IF NOT EXISTS evento_start VARCHAR(10) NOT NULL DEFAULT '2026-05-04'`);
  } catch (e) {
    // Column might already exist or table might be locked, ignore if it's just 'already exists'
  }
}

// ── GET: return current running total for this event week ──────────────────
export async function GET() {
  try {
    await ensureTable();
    const rows = await query(
      `SELECT COALESCE(SUM(cantidad), 0) AS total
       FROM evento_pedidos_ingresados
       WHERE evento_start = $1`,
      [EVENT_START]
    ) as any[];
    const total = Number(rows[0]?.total || 0);
    return NextResponse.json({ total, eventoStart: EVENT_START });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: sync sheet → DB, deduplicate by nro_pedido, return new total ─────
export async function POST() {
  try {
    await ensureTable();

    // 1. Fetch all rows from both ING sheets
    const allRows: { nroPedido: string; cantidad: number }[] = [];

    for (const sheet of ING_SHEETS) {
      const url = csvUrl(sheet.id, sheet.gid);
      let text: string;
      try {
        const res = await fetch(url, { next: { revalidate: 0 } });
        if (!res.ok) continue;
        text = await res.text();
      } catch { continue; }

      const rows = parseCsv(text);
      // Skip header row (row 0)
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length < 29) continue;
        const nroPedido = (cols[2] || '').trim();
        if (!nroPedido) continue;
        const cantRaw = (cols[28] || '').replace(/,/g, '').trim();
        const cantidad = parseInt(cantRaw, 10);
        if (!nroPedido || isNaN(cantidad) || cantidad <= 0) continue;
        allRows.push({ nroPedido, cantidad });
      }
    }

    if (allRows.length === 0) {
      const rows = await query(
        `SELECT COALESCE(SUM(cantidad), 0) AS total FROM evento_pedidos_ingresados WHERE evento_start = $1`,
        [EVENT_START]
      ) as any[];
      return NextResponse.json({ total: Number(rows[0]?.total || 0), syncCount: 0, eventoStart: EVENT_START });
    }

    // 2. Deduplicate in-memory: group by nroPedido, sum quantities of all lines for that pedido
    const pedidoMap = new Map<string, number>();
    for (const row of allRows) {
      const current = pedidoMap.get(row.nroPedido) || 0;
      pedidoMap.set(row.nroPedido, current + row.cantidad);
    }

    // 3. Upsert into database: 
    let syncCount = 0;
    for (const [nroPedido, cantidad] of pedidoMap.entries()) {
      await query(
        `INSERT INTO evento_pedidos_ingresados (nro_pedido, cantidad, evento_start)
         VALUES ($1, $2, $3)
         ON CONFLICT (nro_pedido) 
         DO UPDATE SET 
            cantidad = EXCLUDED.cantidad,
            created_at = NOW()`,
        [nroPedido, cantidad, EVENT_START]
      );
      syncCount++;
    }

    // 4. Return updated total
    const totalRows = await query(
      `SELECT COALESCE(SUM(cantidad), 0) AS total FROM evento_pedidos_ingresados WHERE evento_start = $1`,
      [EVENT_START]
    ) as any[];
    const total = Number(totalRows[0]?.total || 0);

    return NextResponse.json({ total, syncCount, eventoStart: EVENT_START });
  } catch (err: any) {
    console.error('[pedidos-ingresados POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
