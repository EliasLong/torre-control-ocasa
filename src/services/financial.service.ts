import type { Tarifa, Costo, PersonalDiario } from '@/types';
import { getSheetData, parseRows, col, colNum } from '@/lib/google-sheets';
import { getJornalesFromSheet } from '@/lib/raw-sources';

export interface FinancialDataService {
  getTarifas(fecha: Date): Promise<Tarifa[]>;
  getCostos(fecha: Date): Promise<Costo[]>;
  getPersonalDiario(desde: Date, hasta: Date): Promise<PersonalDiario[]>;
}

function filterByVigencia<T extends { vigencia_desde: string; vigencia_hasta: string | null }>(
  data: T[],
  fecha: Date
): T[] {
  const fechaStr = fecha.toISOString().split('T')[0];
  return data.filter(
    d => d.vigencia_desde <= fechaStr && (d.vigencia_hasta === null || d.vigencia_hasta === '' || d.vigencia_hasta >= fechaStr)
  );
}

export const financialService: FinancialDataService = {
  // Tarifas and costos still come from the intermediate Google Sheet (admin-managed)
  getTarifas: async (fecha) => {
    const rows = await getSheetData('tarifas');
    const all = parseRows<Tarifa>(rows, (row, headers) => ({
      servicio: col(row, headers, 'servicio'),
      tarifa: colNum(row, headers, 'tarifa'),
      vigencia_desde: col(row, headers, 'vigencia_desde'),
      vigencia_hasta: col(row, headers, 'vigencia_hasta') || null,
    }));
    return filterByVigencia(all, fecha);
  },

  getCostos: async (fecha) => {
    const rows = await getSheetData('costos');
    const all = parseRows<Costo>(rows, (row, headers) => ({
      concepto: col(row, headers, 'concepto'),
      tipo: col(row, headers, 'tipo') as 'fijo' | 'variable',
      monto: colNum(row, headers, 'monto'),
      vigencia_desde: col(row, headers, 'vigencia_desde'),
      vigencia_hasta: col(row, headers, 'vigencia_hasta') || null,
    }));
    return filterByVigencia(all, fecha);
  },

  // Jornales now come from the real Google Sheet source
  getPersonalDiario: async (desde, hasta) => {
    const allJornales = await getJornalesFromSheet();
    const fromStr = desde.toISOString().split('T')[0];
    const toStr = hasta.toISOString().split('T')[0];
    return allJornales.filter(d => d.fecha >= fromStr && d.fecha <= toStr);
  },
};
