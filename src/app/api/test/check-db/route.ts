import { NextResponse } from 'next/server';
import { query } from '@/lib/sql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await query('SELECT date::text, pick_b2c, pick_b2b, source, imported_at::text FROM evento_resultados_finales ORDER BY date ASC');
    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
