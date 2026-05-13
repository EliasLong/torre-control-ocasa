import { NextResponse } from 'next/server';
import { query } from '@/lib/sql';

export const dynamic = 'force-dynamic';

// ── Google Sheet: "Acumulado Evento" ─────────────────────────────────────────
// Spreadsheet: 15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk
// Sheet gid:   1670433793
// Columns:     A=Fecha | B=Pick B2B | C=Pick B2C | D=TOTAL
const SPREADSHEET_ID = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk';
const GID = '1670433793';

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

/**
 * Parsea una fecha en formato DD/MM/YYYY (o DD-MM-YYYY) y devuelve "YYYY-MM-DD"
 * Retorna null si no se puede parsear.
 */
function parseSheetDate(raw: string): string | null {
  if (!raw || raw.trim() === '') return null;
  const s = raw.trim();

  // DD/MM/YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) {
    const dd = m1[1].padStart(2, '0');
    const mm = m1[2].padStart(2, '0');
    return `${m1[3]}-${mm}-${dd}`;
  }

  // DD/MM/YY
  const m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m2) {
    const dd = m2[1].padStart(2, '0');
    const mm = m2[2].padStart(2, '0');
    const yyyy = `20${m2[3]}`;
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const url = csvUrl(SPREADSHEET_ID, GID);
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `No se pudo leer el sheet: HTTP ${res.status}` },
        { status: 500 }
      );
    }

    const text = await res.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return NextResponse.json({ success: true, message: 'No hay filas de datos en el sheet', imported: 0 });
    }

    // Fila 0 es el header: Fecha | Pick B2B | Pick B2C | TOTAL
    // Los datos empiezan en fila 1
    const imported: { date: string; pick_b2c: number; pick_b2b: number }[] = [];
    const skipped: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || cols.length < 3) continue;

      const rawDate = (cols[0] || '').trim();
      const rawB2B  = (cols[1] || '').replace(/[,\s]/g, '');
      const rawB2C  = (cols[2] || '').replace(/[,\s]/g, '');

      // Skip header repeats or empty rows
      if (rawDate.toLowerCase().includes('fecha') || rawDate === '') continue;

      const sqlDate = parseSheetDate(rawDate);
      if (!sqlDate) {
        skipped.push(`Fila ${i + 1}: fecha inválida "${rawDate}"`);
        continue;
      }

      const pickB2B = parseInt(rawB2B, 10) || 0;
      const pickB2C = parseInt(rawB2C, 10) || 0;

      // Solo importar si al menos uno de los dos tiene valor
      if (pickB2C === 0 && pickB2B === 0) {
        skipped.push(`Fila ${i + 1}: ${sqlDate} — ambos valores son 0, se omite`);
        continue;
      }

      // UPSERT: si ya existe el registro para ese día, se actualiza siempre
      // (el sheet es la fuente oficial definitiva)
      await query(`
        INSERT INTO evento_resultados_finales (date, pick_b2c, pick_b2b, source, imported_at)
        VALUES ($1, $2, $3, 'google_sheet_acumulado', NOW())
        ON CONFLICT (date) DO UPDATE SET
          pick_b2c    = EXCLUDED.pick_b2c,
          pick_b2b    = EXCLUDED.pick_b2b,
          source      = EXCLUDED.source,
          imported_at = NOW();
      `, [sqlDate, pickB2C, pickB2B]);

      imported.push({ date: sqlDate, pick_b2c: pickB2C, pick_b2b: pickB2B });
    }

    return NextResponse.json({
      success: true,
      message: `Importación completa: ${imported.length} día(s) procesados`,
      imported,
      skipped,
    });
  } catch (error: any) {
    console.error('[import-resultados-finales] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
