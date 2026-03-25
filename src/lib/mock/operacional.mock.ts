import { PalletOut, OperacionDiaria } from '@/types';

// Deterministic pseudo-random based on seed
function seededValue(day: number, offset: number, min: number, max: number): number {
  // Simple deterministic hash: produces consistent values per (day, offset)
  const hash = ((day * 31 + offset * 17) * 2654435761) >>> 0;
  const normalized = (hash % 10000) / 10000;
  return Math.round(min + normalized * (max - min));
}

// Day of week for March 2026 (March 1 = Sunday)
// 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
function dayOfWeek(day: number): number {
  // March 1, 2026 is a Sunday
  return (day - 1) % 7;
}

function isWeekend(day: number): boolean {
  const dow = dayOfWeek(day);
  return dow === 0 || dow === 6;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Generate 30 days of PalletOut data (4 entries per day: B2C-PL2, B2C-PL3, B2B-PL2, B2B-PL3)
export const palletsOutMock: PalletOut[] = [];

for (let day = 1; day <= 30; day++) {
  const fecha = `2026-03-${pad(day)}`;
  const weekendFactor = isWeekend(day) ? 0.6 : 1.0;

  const b2cPl2 = Math.round(seededValue(day, 1, 15, 40) * weekendFactor);
  const b2cPl3 = Math.round(seededValue(day, 2, 15, 40) * weekendFactor);
  const b2bPl2 = Math.round(seededValue(day, 3, 20, 60) * weekendFactor);
  const b2bPl3 = Math.round(seededValue(day, 4, 20, 60) * weekendFactor);

  palletsOutMock.push(
    { fecha, pallets: b2cPl2, tipo: 'B2C', planta: 'PL2' },
    { fecha, pallets: b2cPl3, tipo: 'B2C', planta: 'PL3' },
    { fecha, pallets: b2bPl2, tipo: 'B2B', planta: 'PL2' },
    { fecha, pallets: b2bPl3, tipo: 'B2B', planta: 'PL3' },
  );
}

// Generate 30 days of OperacionDiaria data
export const operacionesMock: OperacionDiaria[] = [];

for (let day = 1; day <= 30; day++) {
  const fecha = `2026-03-${pad(day)}`;
  const weekendFactor = isWeekend(day) ? 0.65 : 1.0;

  const picking = Math.round(seededValue(day, 10, 2000, 4000) * weekendFactor);
  const pallets_in = Math.round(seededValue(day, 11, 100, 200) * weekendFactor);
  const contenedores = Math.round(seededValue(day, 12, 5, 20) * weekendFactor);

  operacionesMock.push({ fecha, picking, pallets_in, contenedores });
}

// Legacy format for existing components (backward compatibility)
// Chesterton's Fence: existing components (OperacionalTab, KPI cards) consume this format
export const operacionalMock = {
  kpis: {
    contenedoresHoy: operacionesMock[operacionesMock.length - 1]?.contenedores ?? 12,
    palletsIn: operacionesMock[operacionesMock.length - 1]?.pallets_in ?? 148,
    palletsOut: palletsOutMock
      .filter(p => p.fecha === `2026-03-30`)
      .reduce((sum, p) => sum + p.pallets, 0) || 132,
    pickingTotal: operacionesMock[operacionesMock.length - 1]?.picking ?? 3210,
    cumplimientoCapacidad: 82,
  },
  evolutivo: operacionesMock.slice(0, 8).map(op => {
    const palletsOutDay = palletsOutMock
      .filter(p => p.fecha === op.fecha)
      .reduce((sum, p) => sum + p.pallets, 0);
    return {
      fecha: op.fecha,
      contenedores: op.contenedores,
      palletsIn: op.pallets_in,
      palletsOut: palletsOutDay,
      picking: op.picking,
      capacidad: 3900,
      presupuesto: 3500,
    };
  }),
};
