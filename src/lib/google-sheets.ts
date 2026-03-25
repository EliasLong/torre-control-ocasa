const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY!;
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// --- Read operations (using API Key — public read) ---

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const url = `${BASE_URL}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`;
  const res = await fetch(url, { next: { revalidate: 60 } }); // cache 60s
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets API error (${res.status}): ${text}`);
  }
  const data = await res.json();
  return (data.values as string[][]) ?? [];
}

export async function getSheetNames(): Promise<string[]> {
  const url = `${BASE_URL}?fields=sheets.properties.title&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to get sheet names: ${res.status}`);
  const data = await res.json();
  return data.sheets?.map((s: { properties: { title: string } }) => s.properties.title) ?? [];
}

// --- Parse helpers ---

export function parseRows<T>(rows: string[][], mapper: (row: string[], headers: string[]) => T): T[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1)
    .filter(row => row.some(cell => cell.trim() !== ''))
    .map(row => mapper(row, headers));
}

export function col(row: string[], headers: string[], name: string): string {
  const idx = headers.indexOf(name.toLowerCase());
  return idx >= 0 ? (row[idx] ?? '').trim() : '';
}

export function colNum(row: string[], headers: string[], name: string): number {
  const val = col(row, headers, name).replace(/[,$\s]/g, '');
  return Number(val) || 0;
}
