import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getMovimientosPorFechas, isPicking } from '@/services/indicadores.service';
import { query } from '@/lib/sql';
// ── Sheet IDs ──────────────────────────────────────────────────────────────
const SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM';
const SPREADSHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI';
const SPREADSHEET_DEVOLUCIONES = '1NyuFejOKhFnu_VNvUBqoWTP6hpMUSPPd';
const SPREADSHEET_INGRESADOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY';
const SPREADSHEET_INCIDENCIAS = '1IABChnxxxRB9JnUe83OdNxRq6doDpDntg9j_rXxYK7s';

export const SHEETS = {
  PL2_B2C: { id: SPREADSHEET_B2C, gid: '0', type: 'B2C' },
  PL3_B2C: { id: SPREADSHEET_B2C, gid: '2008554442', type: 'B2C' },
  PL2_B2B: { id: SPREADSHEET_B2B, gid: '1832488493', type: 'B2B' },
  PL3_B2B: { id: SPREADSHEET_B2B, gid: '2114457503', type: 'B2B' },
  PL2_DEVOLUCIONES: { id: SPREADSHEET_DEVOLUCIONES, gid: '745153814', type: 'DEV' },
  PL3_DEVOLUCIONES: { id: SPREADSHEET_DEVOLUCIONES, gid: '573838045', type: 'DEV' },
  PL2_INGRESADOS: { id: SPREADSHEET_INGRESADOS, gid: '0', type: 'ING' },
  PL3_INGRESADOS: { id: SPREADSHEET_INGRESADOS, gid: '1150456694', type: 'ING' },
  INCIDENCIAS: { id: SPREADSHEET_INCIDENCIAS, gid: '468898453', type: 'INC' }
} as const;

// ── Trip sheet configs ─────────────────────────────────────────────────────
// Each sheet has: spreadsheet ID, gid, date column index, and whether it has
// a double header row (row 0 = group label, row 1 = real column names).
const TRIP_SHEETS = [
  {
    // PL2 B2B: SPREADSHEET_B2C gid=2008554442 — col [13] = "FECHA DE DESPACHO"
    // Has double header: row 0 is meta-header, row 1 is the real header
    id: SPREADSHEET_B2C, gid: '2008554442', dateCol: 13, doubleHeader: true,
    label: 'PL2_B2B_DESPACHO',
  },
  {
    // PL3 B2B: SPREADSHEET_B2C gid=0 — col [12] = "Fecha de Salida"
    // Has double header: row 0 is meta-header, row 1 is the real header
    id: SPREADSHEET_B2C, gid: '0', dateCol: 12, doubleHeader: true,
    label: 'PL3_B2B_SALIDA',
  },
  {
    // PL3 B2B: SPREADSHEET_B2B gid=2114457503 — col [16] = "Hora Inicio"
    // Single header row. Values are either dates (DD/M/YYYY) or times (hh:mm:ss)
    // Only count rows where the cell contains a date (not a time)
    id: SPREADSHEET_B2B, gid: '2114457503', dateCol: 16, doubleHeader: false,
    label: 'PL3_B2B_HORAINICIO',
  },
  {
    // PL2 B2B: SPREADSHEET_B2B gid=1832488493 — col [16] = "Fecha de Salida"
    // Single header row. Values may include timestamp suffix (DD/M/YYYY HH:mm:ss)
    id: SPREADSHEET_B2B, gid: '1832488493', dateCol: 16, doubleHeader: false,
    label: 'PL2_B2B_SALIDA',
  },
] as const;

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
  const s = raw.trim();

  // Try DD-MMM-YY or DD-MMM-YYYY
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1].toUpperCase();
      const month = parseInt(MONTHS[monthStr] || '1', 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Fallback to standard sheet date parser (handles DD/MM/YYYY)
  return parseSheetDate(s);
}

function parseDispatchDate(rawDispatch: string, rowDate: Date | null): Date | null {
  if (!rawDispatch || rawDispatch.trim() === '') return null;
  const datePart = rawDispatch.split(' ')[0];
  const explicitDate = parseSheetDate(datePart);
  if (explicitDate) return explicitDate;
  return rowDate;
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

function getTodayAr(): Date {
  const now = new Date();
  const arTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return new Date(arTime.getUTCFullYear(), arTime.getUTCMonth(), arTime.getUTCDate());
}

// ── Row parsers per sheet type ─────────────────────────────────────────────

interface SheetRow {
  date: Date | null;
  dispatchDate: Date | null;
  bultos: number;
  pallets: number;
  transportType?: string;
}

function parseB2CRow(cols: string[], gid: string): SheetRow | null {
  const rawDate = cols[0];
  const date = parseSheetDate(rawDate);
  const bultosCol = parseFloat(cols[4]) || 0;
  const cantTareasCol = parseFloat(cols[7]) || 0;
  const bultos = bultosCol + cantTareasCol;
  const pallets = parseFloat(cols[5]) || 0;

  let rawDispatch = '';
  if (gid === '0') rawDispatch = cols[12] || '';
  else rawDispatch = cols[13] || '';
  const dispatchDate = parseDispatchDate(rawDispatch, date);

  return { date, dispatchDate, bultos, pallets };
}

function parseB2BRow(cols: string[], gid: string): SheetRow | null {
  const rawDate = cols[0];
  const date = parseSheetDate(rawDate);
  const bultos = parseFloat(cols[8]) || 0;
  const pallets = parseFloat(cols[9]) || parseFloat(cols[10]) || 0;

  const rawDispatch = cols[16] || '';
  const dispatchDate = parseDispatchDate(rawDispatch, date);

  return { date, dispatchDate, bultos, pallets };
}

function parseIngresadosRow(cols: string[]): SheetRow | null {
  if (cols.length < 29) return null;
  // Use "Programada" column (index 9) for date
  const date = parseIngresadosDate(cols[9]);
  const bultos = parseFloat(cols[28]) || 0;
  const transportType = (cols[23] || '').trim().toUpperCase();
  return { date, dispatchDate: null, bultos, pallets: 0, transportType };
}

function parseIncidenciasRow(cols: string[]): SheetRow | null {
  if (cols.length < 8) return null;
  const rawDate = cols[0] || '';
  const datePart = rawDate.split(' ')[0];
  const date = parseSheetDate(datePart);
  const cantidad = parseFloat(cols[7]) || 0;
  return { date, dispatchDate: null, bultos: cantidad, pallets: 0 };
}

// ── Trip fetcher ──────────────────────────────────────────────────────────
// Returns a map of dateKey (DD/MM) → count of trips dispatched that day.
async function fetchTripCounts(
  sheet: typeof TRIP_SHEETS[number],
  eventDays: string[]
): Promise<Record<string, number>> {
  const url = csvUrl(sheet.id, sheet.gid);
  let text: string;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return {};
    text = await res.text();
  } catch {
    return {};
  }

  const rows = parseCsv(text);
  const counts: Record<string, number> = {};

  // Skip 1 or 2 header rows depending on the sheet
  const dataStart = sheet.doubleHeader ? 2 : 1;

  for (let i = dataStart; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length <= sheet.dateCol) continue;
    const raw = (cols[sheet.dateCol] || '').trim();
    if (!raw) continue;

    // Parse the date portion (ignore any time suffix)
    const datePart = raw.split(' ')[0]; // handles "27/4/2026 9:05:19" → "27/4/2026"
    const d = parseSheetDate(datePart);
    if (!d || d.getFullYear() !== 2026) continue;

    const key = formatDateKey(d);
    if (!eventDays.includes(key)) continue;

    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

// ── Main fetcher ───────────────────────────────────────────────────────────

export async function fetchSheetRows(
  spreadsheetId: string,
  gid: string,
  type: 'B2C' | 'B2B' | 'DEV' | 'ING' | 'INC'
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

    if (type === 'ING') {
      // For ING sheets: skip header row (col[0] = 'Unidad Operativa') and empty rows
      const col0 = (cols[0] || '').trim();
      const col9 = (cols[9] || '').trim();
      if (col0.toLowerCase() === 'unidad operativa') continue; // header
      if (col9 === '' || col9.toLowerCase() === 'programada') continue; // no date
      const row = parseIngresadosRow(cols);
      if (row) results.push(row);
      continue;
    }

    if (!cols || cols.length < 5) continue;
    const col0 = (cols[0] || '').trim();
    if (col0 === '' || col0.toLowerCase().includes('fecha') || col0.includes('Source:')) continue;

    let row: SheetRow | null = null;
    if (type === 'B2C') row = parseB2CRow(cols, gid);
    else if (type === 'B2B') row = parseB2BRow(cols, gid);
    else if (type === 'DEV') {
      const date = parseSheetDate(cols[0]);
      const quantity = Math.round(parseFloat(cols[5])) || 0;
      row = { date, dispatchDate: null, bultos: quantity, pallets: 0 };
    } else if (type === 'INC') {
      row = parseIncidenciasRow(cols);
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
  tripsB2C: number;   // legacy — kept for snapshot compat, not used in chart
  tripsB2B: number;   // legacy — kept for snapshot compat, not used in chart
  viajesTotal: number; // NEW: real dispatched trips from the 4 trip sheets
  despachadosBultos: number;
  camionesDespB2B: number;
  devoluciones: number;
  ingresados: number;
  ingresadosFlota: number;
  ingRetiMeli?: number;
  ingAndreani?: number;
  ingFlotaPropia?: number;
  ingOtros?: number;
  incidencias: number;
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
    viajesTotal: number;
    despachadosBultos: number;
    camionesDespB2B: number;
    devoluciones: number;
    ingresados: number;
    ingresadosFlota: number;
    incidencias: number;
  };
  // Volumen por Transporte: totals from ALL rows in ING sheets, no date filter
  // 4 categories: Retira Meli | Andreani | Flota Propia | Otros
  volumenRetiMeli: number;
  volumenAndreani: number;
  volumenFlotaPropia: number;
  volumenOtros: number;
  availableDays: string[];
}

export async function getEventoData(): Promise<EventoKPIsResponse> {
  try {
    const EVENT_DAYS: string[] = [];
    const EVENT_DAYS_YYYY_MM_DD: string[] = [];
    const today = getTodayAr();

    // ── Evento Hot Sale / Cyber: fechas fijas 11/05 → 18/05/2026 ─────────────
    const EVENT_START = new Date(2026, 4, 11); // 11 May 2026 (month = 0-indexed)
    const EVENT_END   = new Date(2026, 4, 18); // 18 May 2026
    for (let cur = new Date(EVENT_START); cur <= EVENT_END; cur.setDate(cur.getDate() + 1)) {
      EVENT_DAYS.push(formatDateKey(cur));
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      EVENT_DAYS_YYYY_MM_DD.push(`${yyyy}-${mm}-${dd}`);
    }

    const [pl2b2c, pl3b2c, pl2b2b, pl3b2b, pl2dev, pl3dev, pl2ing, pl3ing, incidencias, pickingMovs, ...tripCountsArr] = await Promise.all([
      fetchSheetRows(SHEETS.PL2_B2C.id, SHEETS.PL2_B2C.gid, 'B2C'),
      fetchSheetRows(SHEETS.PL3_B2C.id, SHEETS.PL3_B2C.gid, 'B2C'),
      fetchSheetRows(SHEETS.PL2_B2B.id, SHEETS.PL2_B2B.gid, 'B2B'),
      fetchSheetRows(SHEETS.PL3_B2B.id, SHEETS.PL3_B2B.gid, 'B2B'),
      fetchSheetRows(SHEETS.PL2_DEVOLUCIONES.id, SHEETS.PL2_DEVOLUCIONES.gid, 'DEV'),
      fetchSheetRows(SHEETS.PL3_DEVOLUCIONES.id, SHEETS.PL3_DEVOLUCIONES.gid, 'DEV'),
      fetchSheetRows(SHEETS.PL2_INGRESADOS.id, SHEETS.PL2_INGRESADOS.gid, 'ING'),
      fetchSheetRows(SHEETS.PL3_INGRESADOS.id, SHEETS.PL3_INGRESADOS.gid, 'ING'),
      fetchSheetRows(SHEETS.INCIDENCIAS.id, SHEETS.INCIDENCIAS.gid, 'INC'),
      getMovimientosPorFechas(EVENT_DAYS_YYYY_MM_DD),
      // Fetch trip counts from all 4 trip sheets in parallel
      ...TRIP_SHEETS.map(s => fetchTripCounts(s, EVENT_DAYS)),
    ]);

    // Merge trip counts from all 4 sheets into a single map
    const mergedTripCounts: Record<string, number> = {};
    for (const counts of tripCountsArr as Record<string, number>[]) {
      for (const [day, n] of Object.entries(counts)) {
        mergedTripCounts[day] = (mergedTripCounts[day] || 0) + n;
      }
    }

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
        viajesTotal: 0,
        despachadosBultos: 0,
        camionesDespB2B: 0,
        devoluciones: 0,
        ingresados: 0,
        ingresadosFlota: 0,
        ingRetiMeli: undefined,
        ingAndreani: undefined,
        ingFlotaPropia: undefined,
        ingOtros: undefined,
        incidencias: 0
      };
    });

    function addToDay(key: string, b2c: boolean, row: SheetRow) {
      if (row.dispatchDate && row.dispatchDate.getFullYear() === 2026) {
        const dispatchKey = formatDateKey(row.dispatchDate);
        if (EVENT_DAYS.includes(dispatchKey)) {
          byDay[dispatchKey].despachadosBultos += row.bultos;
          if (!b2c) {
            byDay[dispatchKey].camionesDespB2B += 1;
          }
        }
      }

      if (!EVENT_DAYS.includes(key)) return;

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
    // Step removed: ING rows are no longer filtered by their internal date column.
    // Instead, they are summed globally below and attributed to "today".


    // Volumen por Transporte: sum ALL ING rows regardless of date.
    // 4 categories determined by the "Transporte" column (col[23]):
    //   Retira Meli  → transport contains "MELI"
    //   Andreani     → transport contains "ANDREANI" (covers all variants)
    //   Flota Propia → transport contains "FLOTA PROPIA"
    //   Otros        → everything else
    let volumenRetiMeli = 0;
    let volumenAndreani = 0;
    let volumenFlotaPropia = 0;
    let volumenOtros = 0;
    for (const row of allIng) {
      // Only process 2026 data
      if (row.date && row.date.getFullYear() !== 2026) continue;
      const t = (row.transportType || '').toUpperCase();
      if (t.includes('MELI')) {
        volumenRetiMeli += row.bultos;
      } else if (t.includes('ANDREANI')) {
        volumenAndreani += row.bultos;
      } else if (t.includes('FLOTA PROPIA')) {
        volumenFlotaPropia += row.bultos;
      } else {
        volumenOtros += row.bultos;
      }
    }

    // The Volumen por Transporte chart ONLY uses the 6am snapshot saved by the cron.
    // Live data is intentionally omitted to avoid confusion.
    const todayKey = formatDateKey(today);

    // Apply trip counts to byDay
    for (const [day, n] of Object.entries(mergedTripCounts)) {
      if (byDay[day]) {
        byDay[day].viajesTotal = n;
      }
    }

    for (const row of [...pl2dev, ...pl3dev]) {
      if (row.date && row.date.getFullYear() === 2026) {
        const key = formatDateKey(row.date);
        if (EVENT_DAYS.includes(key)) {
          byDay[key].devoluciones += row.bultos;
        }
      }
    }

    for (const row of incidencias) {
      if (row.date && row.date.getFullYear() === 2026) {
        const key = formatDateKey(row.date);
        if (EVENT_DAYS.includes(key)) {
          byDay[key].incidencias += row.bultos;
        }
      }
    }

    for (const mov of pickingMovs) {
      if (!isPicking(mov)) continue;
      // Only process 2026 data
      if (!mov.fecha.startsWith('2026')) continue;
      const parts = mov.fecha.split('-');
      if (parts.length !== 3) continue;
      const key = `${parts[2]}/${parts[1]}`;
      if (!EVENT_DAYS.includes(key)) continue;
      const cantidad = Math.abs(mov.cantidad);
      const cli = (mov.cliente || '').toUpperCase();
      const lpn = (mov.lpnTransferido || '').toUpperCase();

      const isB2C = cli === 'B2C' || lpn.startsWith('B2C');
      const isB2B = cli === 'B2B' || lpn.startsWith('B2B');

      if (isB2C) {
        byDay[key].bultosB2C += cantidad;
      } else if (isB2B) {
        byDay[key].bultosB2B += cantidad;
      }
    }

    // ── Capture live values AFTER all computation loops ──────────────────────
    // This snapshot is used as fallback when a DB snapshot has 0 for a field.
    // ingresados fallback = global ING total (volumen acumulado), NOT per-day sum,
    // because the Volumen chart needs to show how the operation started that day.
    const liveValues: Record<string, {
      ingresados: number; ingresadosFlota: number;
      ingRetiMeli?: number; ingAndreani?: number; ingFlotaPropia?: number; ingOtros?: number;
      bultosB2C: number; bultosB2B: number;
      despachadosBultos: number; camionesDespB2B: number;
      devoluciones: number; incidencias: number;
    }> = {};

    for (const key of EVENT_DAYS) {
      const isToday = key === todayKey;
      liveValues[key] = {
        // For ingresados: exclusively use snapshots taken at 6am.
        ingresados: 0,
        ingresadosFlota: 0,
        ingRetiMeli: undefined,
        ingAndreani: undefined,
        ingFlotaPropia: undefined,
        ingOtros: undefined,
        bultosB2C: byDay[key]?.bultosB2C || 0,
        bultosB2B: byDay[key]?.bultosB2B || 0,
        despachadosBultos: byDay[key]?.despachadosBultos || 0,
        camionesDespB2B: byDay[key]?.camionesDespB2B || 0,
        devoluciones: byDay[key]?.devoluciones || 0,
        incidencias: byDay[key]?.incidencias || 0,
      };
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
          const live = liveValues[key] || {};

          // For every field: prefer snapshot if > 0, otherwise fallback to live value.
          // This prevents a snapshot saved with 0 (e.g. cron ran before data loaded)
          // from wiping out values that are calculable from the live sheets.
          // Use Math.max for cumulative metrics to allow live updates during the day
          // while preventing drops to 0 if the sheet is cleared.
          byDay[key].bultosB2C = Math.max(snap.bultos_b2c || 0, live.bultosB2C || 0);
          byDay[key].bultosB2B = Math.max(snap.bultos_b2b || 0, live.bultosB2B || 0);
          byDay[key].palletsB2C = snap.pallets_b2c;
          byDay[key].palletsB2B = snap.pallets_b2b;
          byDay[key].tripsB2C = snap.trips_b2c;
          byDay[key].tripsB2B = snap.trips_b2b;
          byDay[key].despachadosBultos = Math.max(snap.despachados_bultos || 0, live.despachadosBultos || 0);
          byDay[key].camionesDespB2B = Math.max(snap.camiones_desp_b2b || 0, live.camionesDespB2B || 0);
          byDay[key].devoluciones = Math.max(snap.devoluciones || 0, live.devoluciones || 0);
          byDay[key].incidencias = Math.max(snap.incidencias || 0, live.incidencias || 0);
          // ingresados: prefer snapshot if > 0, otherwise fallback to live sheet data
          const snapIng = snap.ingresados || 0;
          const snapIngFlota = snap.ingresados_flota || 0;
          byDay[key].ingresados = snapIng > 0 ? snapIng : (live.ingresados || 0);
          byDay[key].ingresadosFlota = snapIngFlota > 0 ? snapIngFlota : (live.ingresadosFlota || 0);

          if (snap.ing_reti_meli > 0 || snap.ing_andreani > 0 || snap.ing_flota_propia > 0 || snap.ing_otros > 0) {
            byDay[key].ingRetiMeli = snap.ing_reti_meli;
            byDay[key].ingAndreani = snap.ing_andreani;
            byDay[key].ingFlotaPropia = snap.ing_flota_propia;
            byDay[key].ingOtros = snap.ing_otros;
          } else {
            byDay[key].ingRetiMeli = live.ingRetiMeli;
            byDay[key].ingAndreani = live.ingAndreani;
            byDay[key].ingFlotaPropia = live.ingFlotaPropia;
            byDay[key].ingOtros = live.ingOtros;
          }
        }
      }
    }

    // RECOVERY: Manually injected values for D1 (11/05) as source was lost.
    // This is applied here to ensure it works even if the DB snapshot query fails.
    if (byDay['11/05']) {
      if (byDay['11/05'].bultosB2C === 0) byDay['11/05'].bultosB2C = 1736;
      if (byDay['11/05'].bultosB2B === 0) byDay['11/05'].bultosB2B = 1635;
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
        acc.viajesTotal += d.viajesTotal;
        acc.despachadosBultos += d.despachadosBultos;
        acc.camionesDespB2B += d.camionesDespB2B;
        acc.devoluciones += d.devoluciones;
        acc.ingresados += d.ingresados;
        acc.ingresadosFlota += d.ingresadosFlota;
        acc.incidencias += d.incidencias;
        return acc;
      },
      {
        bultosB2C: 0,
        bultosB2B: 0,
        palletsB2C: 0,
        palletsB2B: 0,
        tripsB2C: 0,
        tripsB2B: 0,
        viajesTotal: 0,
        despachadosBultos: 0,
        camionesDespB2B: 0,
        devoluciones: 0,
        ingresados: 0,
        ingresadosFlota: 0,
        incidencias: 0
      }
    );

    const response: EventoKPIsResponse = { byDay, totals, availableDays, volumenRetiMeli, volumenAndreani, volumenFlotaPropia, volumenOtros };
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