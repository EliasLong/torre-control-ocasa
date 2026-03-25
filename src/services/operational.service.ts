import type { PalletOut, OperacionDiaria, ObjetivosMensuales } from '@/types';
import { getPalletsOutFromSheets, getOperacionesFromSql } from '@/lib/raw-sources';
import { getSheetData, parseRows, col, colNum } from '@/lib/google-sheets';

export interface OperationalDataService {
  getPalletsOut(desde: Date, hasta: Date): Promise<PalletOut[]>;
  getOperaciones(desde: Date, hasta: Date): Promise<OperacionDiaria[]>;
  getObjetivos(mes: string): Promise<ObjetivosMensuales>;
}

function filterByDateRange<T extends { fecha: string }>(data: T[], desde: Date, hasta: Date): T[] {
  const fromStr = desde.toISOString().split('T')[0];
  const toStr = hasta.toISOString().split('T')[0];
  return data.filter(d => d.fecha >= fromStr && d.fecha <= toStr);
}

export const operationalService: OperationalDataService = {
  getPalletsOut: async (desde, hasta) => {
    const allPallets = await getPalletsOutFromSheets();
    return filterByDateRange(allPallets, desde, hasta);
  },

  getOperaciones: async (desde, hasta) => {
    const allOps = await getOperacionesFromSql();
    return filterByDateRange(allOps, desde, hasta);
  },

  getObjetivos: async (mes) => {
    // Objetivos still come from the intermediate Google Sheet
    const rows = await getSheetData('objetivos');
    const all = parseRows(rows, (row, headers) => ({
      mes: col(row, headers, 'mes'),
      contenedores: colNum(row, headers, 'contenedores'),
      pallets_in: colNum(row, headers, 'pallets_in'),
      picking: colNum(row, headers, 'picking'),
      pallets_out: colNum(row, headers, 'pallets_out'),
    }));
    const match = all.find(o => o.mes === mes);
    return match
      ? { contenedores: match.contenedores, pallets_in: match.pallets_in, picking: match.picking, pallets_out: match.pallets_out }
      : { contenedores: 150, pallets_in: 6800, picking: 43530, pallets_out: 8944 };
  },
};
