import { NextResponse } from 'next/server';
import { sheetsService } from '@/services/sheets.service';

export async function GET() {
  try {
    const rawData = await sheetsService.getMermaData();

    // Aggregate into KPI shape expected by the page
    let totalValor = 0;
    const porMotivo: Record<string, number> = {};
    const porMes: Record<string, number> = {};

    for (const item of rawData) {
      totalValor += item.valor;
      porMotivo[item.motivo] = (porMotivo[item.motivo] ?? 0) + item.valor;

      const mes = item.fecha.slice(0, 7);
      porMes[mes] = (porMes[mes] ?? 0) + item.valor;
    }

    // Estimate total despachos value for merma percentage (use a reference value)
    const totalDespachos = 7000000000; // This should come from financiero data in production
    const mermaPorc = totalDespachos > 0 ? totalValor / totalDespachos : 0;

    // Build categories from motivos
    const porCategoria = Object.entries(porMotivo).map(([categoria, monto]) => ({
      categoria,
      monto,
    }));

    // Build evolutivo
    const mesesOrden = Object.keys(porMes).sort();
    const mesLabels: Record<string, string> = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
      '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
    };
    const evolutivo = mesesOrden.map(mes => ({
      mes: mesLabels[mes.slice(5, 7)] ?? mes,
      mermaPorc: totalDespachos > 0 ? porMes[mes] / totalDespachos : 0,
    }));

    // Top 3 categories for KPI cards
    const sorted = porCategoria.sort((a, b) => b.monto - a.monto);

    return NextResponse.json({
      kpis: {
        analisis: sorted[0]?.monto ?? 0,
        calidad: sorted[1]?.monto ?? 0,
        despachos: totalDespachos,
        mermaPorc,
        objetivo: 0.005,
      },
      evolutivo,
      porCategoria: sorted.slice(0, 5),
    });
  } catch (error) {
    console.error('Error in merma API:', error);
    return NextResponse.json({ error: 'Error fetching merma data' }, { status: 500 });
  }
}
