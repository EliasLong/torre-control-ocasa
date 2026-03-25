import { NextRequest, NextResponse } from 'next/server';
import { operationalService } from '@/services/operational.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || '2026-03-01';
    const to = searchParams.get('to') || '2026-03-30';
    const desde = new Date(from);
    const hasta = new Date(to);
    const mesKey = from.slice(0, 7);

    const [palletsOut, operaciones, objetivos] = await Promise.all([
      operationalService.getPalletsOut(desde, hasta),
      operationalService.getOperaciones(desde, hasta),
      operationalService.getObjetivos(mesKey),
    ]);

    return NextResponse.json({ palletsOut, operaciones, objetivos });
  } catch (error) {
    console.error('Error in operacional API:', error);
    return NextResponse.json({ error: 'Error fetching operacional data' }, { status: 500 });
  }
}
