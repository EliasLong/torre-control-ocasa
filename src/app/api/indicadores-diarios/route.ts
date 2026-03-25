import { NextRequest, NextResponse } from 'next/server';
import {
  getResumenDelDia,
  getMovimientosDelDia,
  getHistorico30Dias,
  getTurnoBreakdown,
} from '@/services/indicadores.service';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let fecha = searchParams.get('fecha') || '';

    if (!fecha) {
      fecha = new Date().toISOString().split('T')[0];
    }

    if (!DATE_RE.test(fecha)) {
      return NextResponse.json(
        { error: 'Parámetro fecha inválido. Formato esperado: YYYY-MM-DD' },
        { status: 400 },
      );
    }

    const [resumen, movimientos, historico] = await Promise.all([
      getResumenDelDia(fecha),
      getMovimientosDelDia(fecha),
      getHistorico30Dias(fecha),
    ]);

    const turno = getTurnoBreakdown(movimientos);

    return NextResponse.json({ resumen, turno, movimientos, historico });
  } catch (error) {
    console.error('Error in indicadores-diarios API:', error);
    return NextResponse.json(
      { error: 'Error fetching indicadores diarios data' },
      { status: 500 },
    );
  }
}
