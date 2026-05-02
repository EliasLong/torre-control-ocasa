import { NextRequest, NextResponse } from 'next/server';
import { getMovimientosPorFechas, isPicking } from '@/services/indicadores.service';
import { query } from '@/lib/sql';
// ── Sheet IDs ──────────────────────────────────────────────────────────────
const SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM';
const SPREADSHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI';
const SPREADSHEET_DEVOLUCIONES = '1NyuFejOKhFnu_VNvUBqoWTP6hpMUSPPd';
const SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY';

const SHEETS = {
  PL2_B2C: { id: SPREADSHEET_B2C, gid: '0', type: 'B2C' },
  PL3_B2C: { id: SPREADSHEET_B2C, gid: '2008554442', type: 'B2C' },
  PL2_B2B: { id: SPREADSHEET_B2B, gid: '1832488493', type: 'B2B' },
  PL3_B2B: { id: SPREADSHEET_B2B, gid: '2114457503', type: 'B2B' },
  PL2_DEVOLUCIONES: { id: SPREADSHEET_DEVOLUCIONES, gid: '745153814', type: 'DEV' },
  PL3_DEVOLUCIONES: { id: SPREADSHEET_DEVOLUCIONES, gid: '573838045', type: 'DEV' },
  PL2_INGRESADOS: { id: SPREADSHEET_INGRESADOS, gid: '0', type: 'ING' },
  PL3_INGRESADOS: { id: SPREADSHEET_INGRESADOS, gid: '1150456694', type: 'ING' },
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function csvUrl(spreadsheetId: string, gid: string) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

function parseCsv(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
};

function parseIngresadosDate(raw: string): Date | null {
  if (!raw || raw.trim() === '') return null;
  const parts = raw.trim().split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toUpperCase();
    const month = parseInt(MONTHS[monthStr] || '1', 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function parseSheetDate(raw: string): Date | null {
  if (!raw || raw.trim() === '') return null;
  const s = raw.replace(/[^\d/]/g, '');
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const match2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (match2) {
    const day = parseInt(match2[1], 10);
    const month = parseInt(match2[2], 10) - 1;
    const year = 2000 + parseInt(match2[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatDateKey(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

// ── Row parsers per sheet type ─────────────────────────────────────────────

interface SheetRow {
  date: Date | null;
  bultos: number;
  pallets: number;
  isDispatched: boolean;
}

function parseB2CRow(cols: string[], gid: string): SheetRow | null {
  const rawDate = cols[0];
  const date = parseSheetDate(rawDate);
  const bultosCol = parseFloat(cols[4]) || 0;
  const cantTareasCol = parseFloat(cols[7]) || 0;
  const bultos = bultosCol + cantTareasCol;
  const pallets = parseFloat(cols[5]) || 0;
  const isDispatched = cols.some(c => c.toLowerCase().includes('liberado'));
  return { date, bultos, pallets, isDispatched };
}

function parseB2BRow(cols: string[]): SheetRow | null {
  const rawDate = cols[0];
  const date = parseSheetDate(rawDate);
  const bultos = parseFloat(cols[8]) || 0;
  const pallets = parseFloat(cols[9]) || parseFloat(cols[10]) || 0;
  const isDispatched = cols.some(c => c.toLowerCase().includes('liberado'));
  return { date, bultos, pallets, isDispatched };
}

function parseIngresadosRow(cols: string[]): SheetRow | null {
  if (cols.length < 29) return null;
  const date = parseIngresadosDate(cols[8]);
  const bultos = parseFloat(cols[28]) || 0;
  return { date, bultos, pallets: 0, isDispatched: false };
}

// ── Main fetcher ───────────────────────────────────────────────────────────

async function fetchSheetRows(
  spreadsheetId: string,
  gid: string,
  type: 'B2C' | 'B2B' | 'DEV' | 'ING'
): Promise<SheetRow[]> {
  const url = csvUrl(spreadsheetId, gid);
  let text: string;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return [];
    text = await res.text();
  } catch {
    return [];
  }

  const rows = parseCsv(text);
  const results: SheetRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length < 5) continue;
    const col0 = (cols[0] || '').trim();
    if (col0 === '' || col0.toLowerCase().includes('fecha') || col0.includes('Source:')) continue;

    let row: SheetRow | null = null;
    if (type === 'B2C') row = parseB2CRow(cols, gid);
    else if (type === 'B2B') row = parseB2BRow(cols);
    else if (type === 'DEV') {
      const date = parseSheetDate(cols[0]);
      const quantity = Math.round(parseFloat(cols[5])) || 0;
      row = { date, bultos: quantity, pallets: 0, isDispatched: false };
    } else if (type === 'ING') {
      row = parseIngresadosRow(cols);
    }
    if (row) results.push(row);
  }
  return results;
}

// ── Aggregation ────────────────────────────────────────────────────────────

export interface DayKPIs {
  dateKey: string;
  bultosB2C: number;
  bultosB2B: number;
  palletsB2C: number;
  palletsB2B: number;
  tripsB2C: number;
  tripsB2B: number;
  despachadosBultos: number;
  camionesDespB2B: number;
  devoluciones: number;
  ingresados: number;
}

export interface EventoKPIsResponse {
  byDay: Record<string, DayKPIs>;
  totals: {
    bultosB2C: number;
    bultosB2B: number;
    palletsB2C: number;
    palletsB2B: number;
    tripsB2C: number;
    tripsB2B: number;
    despachadosBultos: number;
    camionesDespB2B: number;
    devoluciones: number;
    ingresados: number;
  };
  availableDays: string[];
}

export async function getEventoData(): Promise<EventoKPIsResponse> {
  try {
    const EVENT_DAYS: string[] = [];
    const EVENT_DAYS_YYYY_MM_DD: string[] = [];
    const today = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      EVENT_DAYS.push(formatDateKey(d));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      EVENT_DAYS_YYYY_MM_DD.push(`${yyyy}-${mm}-${dd}`);
    }

    const [pl2b2c, pl3b2c, pl2b2b, pl3b2b, pl2dev, pl3dev, pl2ing, pl3ing, pickingMovs] = await Promise.all([
      fetchSheetRows(SHEETS.PL2_B2C.id, SHEETS.PL2_B2C.gid, 'B2C'),
      fetchSheetRows(SHEETS.PL3_B2C.id, SHEETS.PL3_B2C.gid, 'B2C'),
      fetchSheetRows(SHEETS.PL2_B2B.id, SHEETS.PL2_B2B.gid, 'B2B'),
      fetchSheetRows(SHEETS.PL3_B2B.id, SHEETS.PL3_B2B.gid, 'B2B'),
      fetchSheetRows(SHEETS.PL2_DEVOLUCIONES.id, SHEETS.PL2_DEVOLUCIONES.gid, 'DEV'),
      fetchSheetRows(SHEETS.PL3_DEVOLUCIONES.id, SHEETS.PL3_DEVOLUCIONES.gid, 'DEV'),
      fetchSheetRows(SHEETS.PL2_INGRESADOS.id, SHEETS.PL2_INGRESADOS.gid, 'ING'),
      fetchSheetRows(SHEETS.PL3_INGRESADOS.id, SHEETS.PL3_INGRESADOS.gid, 'ING'),
      getMovimientosPorFechas(EVENT_DAYS_YYYY_MM_DD),
    ]);

    const allB2C = [...pl2b2c, ...pl3b2c];
    const allB2B = [...pl2b2b, ...pl3b2b];
    const allIng = [...pl2ing, ...pl3ing];

    const byDay: Record<string, DayKPIs> = {};

    EVENT_DAYS.forEach(day => {
      byDay[day] = {
        dateKey: day,
        bultosB2C: 0,
        bultosB2B: 0,
        palletsB2C: 0,
        palletsB2B: 0,
        tripsB2C: 0,
        tripsB2B: 0,
        despachadosBultos: 0,
        camionesDespB2B: 0,
        devoluciones: 0,
        ingresados: 0
      };
    });

    function addToDay(key: string, b2c: boolean, row: SheetRow) {
      if (!EVENT_DAYS.includes(key)) return;
      if (row.isDispatched) {
        byDay[key].despachadosBultos += row.bultos;
        if (!b2c) {
          byDay[key].camionesDespB2B += 1;
        }
      }
      if (b2c) {
        byDay[key].palletsB2C += row.pallets;
        byDay[key].tripsB2C += 1;
      } else {
        byDay[key].palletsB2B += row.pallets;
        byDay[key].tripsB2B += 1;
      }
    }

    for (const row of allB2C) {
      if (row.date) addToDay(formatDateKey(row.date), true, row);
    }
    for (const row of allB2B) {
      if (row.date) addToDay(formatDateKey(row.date), false, row);
    }
    for (const row of allIng) {
      if (row.date) {
        const key = formatDateKey(row.date);
        if (EVENT_DAYS.includes(key)) {
          byDay[key].ingresados += row.bultos;
        }
      }
    }
    for (const row of [...pl2dev, ...pl3dev]) {
      if (row.date) {
        const key = formatDateKey(row.date);
        if (EVENT_DAYS.includes(key)) {
          byDay[key].devoluciones += row.bultos;
        }
      }
    }

    for (const mov of pickingMovs) {
      if (!isPicking(mov)) continue;
      const parts = mov.fecha.split('-');
      if (parts.length !== 3) continue;
      const key = `${parts[2]}/${parts[1]}`;
      if (!EVENT_DAYS.includes(key)) continue;
      const cantidad = Math.abs(mov.cantidad);
      const isB2C = mov.cliente === 'B2C';
      if (isB2C) {
        byDay[key].bultosB2C += cantidad;
      } else {
        byDay[key].bultosB2B += cantidad;
      }
    }

    const snapshots = await query(`
      SELECT * FROM evento_kpi_snapshots
      WHERE date >= $1 AND date <= $2
    `, [EVENT_DAYS_YYYY_MM_DD[0], EVENT_DAYS_YYYY_MM_DD[EVENT_DAYS_YYYY_MM_DD.length - 1]])
      .catch((e: any) => {
        console.error('Error fetching snapshots', e);
        return [];
      });

    if (snapshots && snapshots.length > 0) {
      for (const snap of snapshots as any[]) {
        const d = new Date(snap.date);
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const key = `${dd}/${mm}`;
        if (byDay[key]) {
          byDay[key].bultosB2C = snap.bultos_b2c;
          byDay[key].bultosB2B = snap.bultos_b2b;
          byDay[key].palletsB2C = snap.pallets_b2c;
          byDay[key].palletsB2B = snap.pallets_b2b;
          byDay[key].tripsB2C = snap.trips_b2c;
          byDay[key].tripsB2B = snap.trips_b2b;
          byDay[key].despachadosBultos = snap.despachados_bultos;
          byDay[key].camionesDespB2B = snap.camiones_desp_b2b;
          byDay[key].devoluciones = snap.devoluciones;
          byDay[key].ingresados = snap.ingresados;
        }
      }
    }

    const availableDays = Object.keys(byDay)
      .filter((day) => EVENT_DAYS.includes(day))
      .sort((a, b) => {
        const [da, ma] = a.split('/').map(Number);
        const [db, mb] = b.split('/').map(Number);
        if (ma !== mb) return ma - mb;
        return da - db;
      });

    const totals = availableDays.reduce(
      (acc, key) => {
        const d = byDay[key];
        acc.bultosB2C += d.bultosB2C;
        acc.bultosB2B += d.bultosB2B;
        acc.palletsB2C += d.palletsB2C;
        acc.palletsB2B += d.palletsB2B;
        acc.tripsB2C += d.tripsB2C;
        acc.tripsB2B += d.tripsB2B;
        acc.despachadosBultos += d.despachadosBultos;
        acc.camionesDespB2B += d.camionesDespB2B;
        acc.devoluciones += d.devoluciones;
        acc.ingresados += d.ingresados;
        return acc;
      },
      { bultosB2C: 0, bultosB2B: 0, palletsB2C: 0, palletsB2B: 0, tripsB2C: 0, tripsB2B: 0, despachadosBultos: 0, camionesDespB2B: 0, devoluciones: 0, ingresados: 0 }
    );

    const response: EventoKPIsResponse = { byDay, totals, availableDays };
    return response;
  } catch (err: any) {
    console.error('[evento/kpis]', err);
    throw err;
  }
}

export async function GET(req: NextRequest) {
  try {
    const data = await getEventoData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'Error fetching data', details: err?.message || String(err) }, { status: 500 });
  }
}