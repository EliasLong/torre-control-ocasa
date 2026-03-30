/**
 * Raw data source readers — Google Sheets de origen.
 *
 * Fuentes:
 * - Google Sheet 'operaciones_sql' (via n8n desde SQL Server): picking, contenedores, pallet_in
 * - Google Sheet B2C: pallets_out B2C por planta (PL2/PL3)
 * - Google Sheet B2B: pallets_out B2B por planta (PL2/PL3)
 * - Google Sheet Jornales: personal diario (hoja Pilar)
 */

import type { PalletOut, OperacionDiaria, PersonalDiario } from '@/types';

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY!;

// Source Sheet IDs
const SHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM';
const SHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI';
const SHEET_JORNALES = '1OmjecxLfzAHDiIoG-braeNfPkW4_61oCEv-NIZV4F2s';

// --- Date parsing helpers ---

/** Parse dates like "5/5/2025", "12/05/25", "10/7/2025", "20/03/26", "25-03-2026" to YYYY-MM-DD */
export function parseSheetDate(raw: string): string | null {
  if (!raw || raw.trim() === '') return null;
  const trimmed = raw.trim();
  const sep = trimmed.includes('/') ? '/' : '-';
  const parts = trimmed.split(sep);
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  // Handle 2-digit years: 25 → 2025, 26 → 2026
  if (year < 100) year += 2000;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// --- Google Sheets reader ---

export async function fetchSheetRows(sheetId: string, tabName: string, range?: string): Promise<string[][]> {
  // Wrap tab name in single quotes to prevent Sheets API from interpreting names like "PL3" as cell references
  const quotedTab = `'${tabName}'`;
  const rangeStr = range ? `${encodeURIComponent(quotedTab)}!${range}` : encodeURIComponent(quotedTab);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rangeStr}?key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 60 } }); // cache 1 min
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sheets API error (${sheetId}/${tabName}): ${res.status} - ${text}`);
  }
  const data = await res.json();
  return (data.values as string[][]) ?? [];
}

// --- Pallets Out from Google Sheets ---

interface PalletsByDate {
  [fecha: string]: { PL2: number; PL3: number };
}

function sumPalletsByDate(
  rows: string[][],
  dateColIndex: number,
  palletsColIndex: number,
  headerRows: number
): { [fecha: string]: number } {
  const result: { [fecha: string]: number } = {};

  for (let i = headerRows; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[dateColIndex];
    const fecha = parseSheetDate(rawDate);
    if (!fecha) continue;

    // Only 2026+
    if (fecha < '2026-01-01') continue;

    const rawPallets = row[palletsColIndex];
    // Empty or non-numeric → count as 1 pallet (each row is a despacho)
    let pallets = 1;
    if (rawPallets && rawPallets.trim() !== '') {
      const parsed = parseInt(rawPallets.trim(), 10);
      if (!isNaN(parsed) && parsed > 0) pallets = parsed;
      else if (isNaN(parsed)) continue; // Skip non-numeric like "PISO"
    }

    result[fecha] = (result[fecha] || 0) + pallets;
  }

  return result;
}

export async function getPalletsOutFromSheets(): Promise<PalletOut[]> {
  // Fetch all 4 sources in parallel
  const [b2cPl2, b2cPl3, b2bPl2, b2bPl3] = await Promise.all([
    fetchSheetRows(SHEET_B2C, 'PL2', 'A:F'),
    fetchSheetRows(SHEET_B2C, 'PL3', 'A:F'),
    fetchSheetRows(SHEET_B2B, 'PL2', 'A:K'),
    fetchSheetRows(SHEET_B2B, 'PL3 ', 'A:J'), // trailing space in tab name
  ]);

  // B2C: 2 header rows (row 0 = group header, row 1 = column headers, data from row 2)
  // Col A (0) = fecha, Col F (5) = pallets
  const b2cPl2Data = sumPalletsByDate(b2cPl2, 0, 5, 2);
  const b2cPl3Data = sumPalletsByDate(b2cPl3, 0, 5, 2);

  // B2B: 1 header row (row 0 = headers, data from row 1)
  // PL2: Col A (0) = fecha, Col K (10) = pallets
  // PL3: Col A (0) = fecha, Col J (9) = pallets
  const b2bPl2Data = sumPalletsByDate(b2bPl2, 0, 10, 1);
  const b2bPl3Data = sumPalletsByDate(b2bPl3, 0, 9, 1);

  // Combine into PalletOut[]
  const result: PalletOut[] = [];

  const addEntries = (
    data: { [fecha: string]: number },
    tipo: 'B2C' | 'B2B',
    planta: 'PL2' | 'PL3'
  ) => {
    for (const [fecha, pallets] of Object.entries(data)) {
      result.push({ fecha, pallets, tipo, planta });
    }
  };

  addEntries(b2cPl2Data, 'B2C', 'PL2');
  addEntries(b2cPl3Data, 'B2C', 'PL3');
  addEntries(b2bPl2Data, 'B2B', 'PL2');
  addEntries(b2bPl3Data, 'B2B', 'PL3');

  return result.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// --- Operaciones from Google Sheet (synced by n8n from SQL Server) ---

export async function getOperacionesFromSql(): Promise<OperacionDiaria[]> {
  const ADMIN_SHEET = process.env.GOOGLE_SHEET_ID!;
  const rows = await fetchSheetRows(ADMIN_SHEET, 'operaciones_sql');
  if (rows.length < 2) return [];

  const result: OperacionDiaria[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fecha = parseSheetDate(row[0]);
    if (!fecha || fecha < '2026-01-01') continue;

    result.push({
      fecha,
      picking: parseInt(row[1] || '0', 10) || 0,
      pallets_in: parseInt(row[2] || '0', 10) || 0,
      contenedores: parseInt(row[3] || '0', 10) || 0,
    });
  }

  return result.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// --- Jornales from Google Sheet ---

export async function getJornalesFromSheet(): Promise<PersonalDiario[]> {
  const rows = await fetchSheetRows(SHEET_JORNALES, 'Pilar', 'A:G');
  if (rows.length < 2) return [];

  // Row 0 = headers: Fecha, ..., Jornales dimensionados (5), Jornales ingresados (6)
  const result: PersonalDiario[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fecha = parseSheetDate(row[0]);
    if (!fecha || fecha < '2026-01-01') continue;

    // Use "Jornales ingresados" (col G, index 6) as the primary, fallback to "dimensionados" (col F, index 5)
    const ingresados = parseInt(row[6] || '0', 10) || 0;
    const dimensionados = parseInt(row[5] || '0', 10) || 0;
    const jornales = ingresados > 0 ? ingresados : dimensionados;

    result.push({ fecha, jornales });
  }

  return result.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
