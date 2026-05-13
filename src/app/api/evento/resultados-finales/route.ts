import { NextResponse } from 'next/server';
import { query } from '@/lib/sql';

export const dynamic = 'force-dynamic';

export interface ResultadoFinal {
  date: string;       // YYYY-MM-DD
  dateKey: string;    // DD/MM
  pick_b2c: number;
  pick_b2b: number;
  total: number;
  source: string;
  imported_at: string;
}

export async function GET() {
  try {
    const rows = await query(`
      SELECT 
        date::text,
        pick_b2c,
        pick_b2b,
        (pick_b2c + pick_b2b) AS total,
        source,
        imported_at::text
      FROM evento_resultados_finales
      ORDER BY date ASC
    `);

    const resultados: ResultadoFinal[] = (rows as any[]).map((r) => {
      // date comes as "2026-05-11"
      const parts = r.date.split('-');
      const dateKey = `${parts[2]}/${parts[1]}`;
      return {
        date: r.date,
        dateKey,
        pick_b2c: r.pick_b2c,
        pick_b2b: r.pick_b2b,
        total: r.total,
        source: r.source,
        imported_at: r.imported_at,
      };
    });

    return NextResponse.json({ resultados });
  } catch (error: any) {
    console.error('[evento/resultados-finales] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
