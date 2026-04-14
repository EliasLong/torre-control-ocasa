import { NextRequest, NextResponse } from 'next/server';
import { getCamionesDelDia } from '@/services/camiones.service';

export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fecha = searchParams.get('fecha') || todayLocal();

    if (!DATE_RE.test(fecha)) {
      return NextResponse.json(
        { error: 'Parámetro fecha inválido. Formato esperado: YYYY-MM-DD' },
        { status: 400 },
      );
    }

    const camiones = await getCamionesDelDia(fecha);
    return NextResponse.json({ camiones, fecha });
  } catch (error) {
    console.error('Error in camiones API:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos de camiones' },
      { status: 500 },
    );
  }
}
