import { Tarifa, Costo, PersonalDiario } from '@/types';

// Deterministic pseudo-random based on seed
function seededValue(day: number, offset: number, min: number, max: number): number {
  const hash = ((day * 31 + offset * 17) * 2654435761) >>> 0;
  const normalized = (hash % 10000) / 10000;
  return Math.round(min + normalized * (max - min));
}

// Day of week for March 2026 (March 1 = Sunday)
function isWeekend(day: number): boolean {
  const dow = (day - 1) % 7;
  return dow === 0 || dow === 6;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Tarifas vigentes (valores reales de Tarifas.xlsx)
export const tarifasMock: Tarifa[] = [
  { servicio: 'picking', tarifa: 3869, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { servicio: 'pallet_in', tarifa: 3869, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { servicio: 'pallet_out', tarifa: 3500, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { servicio: 'contenedor', tarifa: 227617, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { servicio: 'guarda', tarifa: 730000000, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { servicio: 'apertura_planta', tarifa: 5179370, vigencia_desde: '2026-01-01', vigencia_hasta: null },
];

// Costos fijos y variables (valores reales de Costos.xlsx)
export const costosMock: Costo[] = [
  { concepto: 'Nómina fija', tipo: 'fijo', monto: 130000000, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { concepto: 'Costo fijo planta', tipo: 'fijo', monto: 700000000, vigencia_desde: '2026-01-01', vigencia_hasta: null },
  { concepto: 'Jornal operario', tipo: 'variable', monto: 723000, vigencia_desde: '2026-01-01', vigencia_hasta: null },
];

// Personal diario: 30 days, weekdays 40-55, weekends 35-42
export const personalDiarioMock: PersonalDiario[] = [];

for (let day = 1; day <= 30; day++) {
  const fecha = `2026-03-${pad(day)}`;
  const weekend = isWeekend(day);
  const jornales = weekend
    ? seededValue(day, 20, 35, 42)
    : seededValue(day, 20, 40, 55);

  personalDiarioMock.push({ fecha, jornales });
}

// Legacy format for existing components (backward compatibility)
export const financieroMock = {
  kpis: {
    ventaHoy: 4850000,
    costoHoy: 3200000,
    rentabilidadHoy: 34.0,
  },
  evolutivo: [
    { fecha: '2026-03-01', venta: 4200000, costo: 2900000, presupuesto: 4500000 },
    { fecha: '2026-03-02', venta: 5100000, costo: 3400000, presupuesto: 4500000 },
    { fecha: '2026-03-03', venta: 3800000, costo: 2700000, presupuesto: 4500000 },
    { fecha: '2026-03-04', venta: 5600000, costo: 3800000, presupuesto: 4500000 },
    { fecha: '2026-03-05', venta: 4700000, costo: 3100000, presupuesto: 4500000 },
    { fecha: '2026-03-06', venta: 4000000, costo: 2800000, presupuesto: 4500000 },
    { fecha: '2026-03-07', venta: 5000000, costo: 3300000, presupuesto: 4500000 },
    { fecha: '2026-03-08', venta: 4850000, costo: 3200000, presupuesto: 4500000 },
  ],
  desglose: [
    { proceso: 'Contenedores', volumen: 12, tarifa: 227617, subtotal: 2731404 },
    { proceso: 'Pallets IN', volumen: 148, tarifa: 3869, subtotal: 572612 },
    { proceso: 'Pallets OUT', volumen: 132, tarifa: 3500, subtotal: 462000 },
    { proceso: 'Picking', volumen: 3210, tarifa: 3869, subtotal: 12419490 },
  ],
};
