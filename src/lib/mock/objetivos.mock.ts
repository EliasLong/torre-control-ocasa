import { ObjetivosMensuales } from '@/types';

// Objetivos mensuales del Excel Objetivo.xlsx (columna Marzo)
// Estos son los totales del mes
export const objetivosMarzoMock: ObjetivosMensuales = {
  contenedores: 150,
  pallets_in: 6800,
  picking: 43530,
  pallets_out: 8944,
};

// Objetivos por mes (para usar cuando se cambie de mes)
export const objetivosPorMes: Record<string, ObjetivosMensuales> = {
  '2026-01': { contenedores: 150, pallets_in: 6800, picking: 43530, pallets_out: 8944 },
  '2026-02': { contenedores: 135, pallets_in: 6120, picking: 35230, pallets_out: 7239 },
  '2026-03': objetivosMarzoMock,
  '2026-04': { contenedores: 150, pallets_in: 6800, picking: 43530, pallets_out: 8944 },
  '2026-05': { contenedores: 188, pallets_in: 9000, picking: 93000, pallets_out: 17978 },
  '2026-06': { contenedores: 274, pallets_in: 12408, picking: 65000, pallets_out: 13355 },
  '2026-07': { contenedores: 138, pallets_in: 6256, picking: 65000, pallets_out: 11917 },
  '2026-08': { contenedores: 95, pallets_in: 4284, picking: 45650, pallets_out: 9380 },
  '2026-09': { contenedores: 95, pallets_in: 6284, picking: 58000, pallets_out: 9380 },
  '2026-10': { contenedores: 311, pallets_in: 14090, picking: 57850, pallets_out: 11886 },
  '2026-11': { contenedores: 303, pallets_in: 13756, picking: 72550, pallets_out: 14907 },
  '2026-12': { contenedores: 200, pallets_in: 9067, picking: 58040, pallets_out: 11925 },
};
