import { NextRequest, NextResponse } from 'next/server';
import { operationalService } from '@/services/operational.service';
import { financialService } from '@/services/financial.service';
import { calcularFacturacion, calcularCostos, calcularResultado } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from') || '2026-03-01';
    const to = searchParams.get('to') || '2026-03-30';
    const desde = new Date(from);
    const hasta = new Date(to);
    const fechaRef = hasta;

    const [palletsOut, operaciones, tarifas, costos, personalDiario] = await Promise.all([
      operationalService.getPalletsOut(desde, hasta),
      operationalService.getOperaciones(desde, hasta),
      financialService.getTarifas(fechaRef),
      financialService.getCostos(fechaRef),
      financialService.getPersonalDiario(desde, hasta),
    ]);

    // Compute totals for the period
    const facturacion = calcularFacturacion(operaciones, palletsOut, tarifas);
    const costosFijos = costos.filter(c => c.tipo === 'fijo');
    const costosVariables = costos.filter(c => c.tipo === 'variable');
    const costosDetalle = calcularCostos(costosFijos, costosVariables, personalDiario, operaciones.length);
    const resultado = calcularResultado(facturacion.total, costosDetalle.total);

    // Compute daily breakdown for charts
    // For daily view: guarda and fijos are prorated per day (monthly / days in month)
    const diasMes = operaciones.length > 0
      ? new Date(new Date(operaciones[0].fecha + 'T12:00:00').getFullYear(), new Date(operaciones[0].fecha + 'T12:00:00').getMonth() + 1, 0).getDate()
      : 30;
    const fijosDiario = costosDetalle.fijos / diasMes;
    const guardaDiaria = facturacion.guarda / diasMes;

    const dailyData = operaciones.map(op => {
      const dayPalletsOut = palletsOut.filter(p => p.fecha === op.fecha);
      const dayPersonal = personalDiario.filter(p => p.fecha === op.fecha);
      const costoVarUnitario = costosVariables.reduce((s, c) => s + c.monto, 0);
      const dayJornales = dayPersonal.reduce((s, j) => s + j.jornales, 0);

      // Facturacion diaria: volumen x tarifa (sin guarda, se suma aparte)
      const dayOps = [op];
      const dayFact = calcularFacturacion(dayOps, dayPalletsOut, tarifas);
      // Override guarda with daily prorated amount
      const dayFactTotal = dayFact.picking + dayFact.pallets_in + dayFact.pallets_out + dayFact.contenedores + guardaDiaria + dayFact.apertura_planta;

      const dayCostosTotal = fijosDiario + (costoVarUnitario * dayJornales);
      const dayResultado = dayFactTotal - dayCostosTotal;
      const dayMargen = dayFactTotal === 0 ? 0 : (dayResultado / dayFactTotal) * 100;

      return {
        fecha: op.fecha,
        facturacion: { ...dayFact, guarda: guardaDiaria, total: dayFactTotal },
        costos: { fijos: fijosDiario, variables: costoVarUnitario * dayJornales, total: dayCostosTotal },
        resultado: dayResultado,
        margen: dayMargen,
      };
    });

    // Helper: find tarifa by normalized name
    const findTarifa = (key: string) => {
      const norm = key.toLowerCase().replace(/\s+/g, '_');
      return tarifas.find(t => {
        const tNorm = t.servicio.toLowerCase().replace(/\s+/g, '_');
        return tNorm === norm || tNorm.startsWith(norm) || norm.startsWith(tNorm);
      })?.tarifa ?? 0;
    };

    // Desglose for breakdown table (total period)
    const sabados = operaciones.filter(o => new Date(o.fecha + 'T12:00:00').getDay() === 6).length;
    const desglose = [
      { servicio: 'Picking', volumen: operaciones.reduce((s, o) => s + o.picking, 0), tarifa: findTarifa('picking'), subtotal: facturacion.picking },
      { servicio: 'Pallets In', volumen: operaciones.reduce((s, o) => s + o.pallets_in, 0), tarifa: findTarifa('pallet_in'), subtotal: facturacion.pallets_in },
      { servicio: 'Pallets Out', volumen: palletsOut.reduce((s, p) => s + p.pallets, 0), tarifa: findTarifa('pallet_out'), subtotal: facturacion.pallets_out },
      { servicio: 'Contenedores', volumen: operaciones.reduce((s, o) => s + o.contenedores, 0), tarifa: findTarifa('contenedor'), subtotal: facturacion.contenedores },
      { servicio: 'Guarda (mensual)', volumen: 1, tarifa: findTarifa('guarda'), subtotal: facturacion.guarda },
      { servicio: 'Apertura Planta (sáb.)', volumen: sabados, tarifa: findTarifa('apertura'), subtotal: facturacion.apertura_planta },
    ];

    return NextResponse.json({
      kpis: {
        facturacion: facturacion.total,
        costos: costosDetalle.total,
        resultado: resultado.resultado,
        margen: resultado.margen,
      },
      costosDetalle: {
        fijos: costosDetalle.fijos,
        variables: costosDetalle.variables,
      },
      monthlyBase: {
        guardaMensual: facturacion.guarda,
        fijosMensuales: costosDetalle.fijos,
      },
      desglose,
      dailyData,
    });
  } catch (error) {
    console.error('Error in financiero API:', error);
    return NextResponse.json({ error: 'Error fetching financiero data' }, { status: 500 });
  }
}
