import { NextRequest, NextResponse } from 'next/server';
import { fetchAllIndicadoresData } from '@/services/indicadores.service';

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

    const data = await fetchAllIndicadoresData(fecha);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in indicadores-diarios API:', error);
    return NextResponse.json(
      { error: 'Error fetching indicadores diarios data' },
      { status: 500 },
    );
  }
}
