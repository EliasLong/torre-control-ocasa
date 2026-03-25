import { getSheetData, parseRows, col, colNum } from '@/lib/google-sheets';
import type { TorreControlData, AlertaOperativa } from '@/lib/mock/torre-control.mock';

export const sheetsService = {
  getMermaData: async () => {
    const rows = await getSheetData('merma');
    return parseRows(rows, (row, headers) => ({
      fecha: col(row, headers, 'fecha'),
      sku: col(row, headers, 'sku'),
      descripcion: col(row, headers, 'descripcion'),
      cantidad: colNum(row, headers, 'cantidad'),
      motivo: col(row, headers, 'motivo'),
      valor: colNum(row, headers, 'valor'),
    }));
  },

  getTorreControlData: async (fecha: string): Promise<TorreControlData> => {
    const rows = await getSheetData('torre_control');
    const all = parseRows(rows, (row, headers) => ({
      fecha: col(row, headers, 'fecha'),
      contenedoresRecibidos: colNum(row, headers, 'contenedores_recibidos'),
      contenedoresPendientes: colNum(row, headers, 'contenedores_pendientes'),
      palletsIn: colNum(row, headers, 'pallets_in'),
      posicionesOcupadas: colNum(row, headers, 'posiciones_ocupadas'),
      posicionesTotales: colNum(row, headers, 'posiciones_totales'),
      palletsOutB2C: colNum(row, headers, 'pallets_out_b2c'),
      palletsOutB2B: colNum(row, headers, 'pallets_out_b2b'),
      pickingCompletado: colNum(row, headers, 'picking_completado'),
      pickingPendiente: colNum(row, headers, 'picking_pendiente'),
      jornalesPresentes: colNum(row, headers, 'jornales_presentes'),
      jornalesTotales: colNum(row, headers, 'jornales_totales'),
      pickingPorJornal: colNum(row, headers, 'picking_por_jornal'),
      palletsOutPorJornal: colNum(row, headers, 'pallets_out_por_jornal'),
    }));

    const match = all.find(d => d.fecha === fecha) ?? all[all.length - 1];

    if (!match) {
      return {
        fecha, contenedoresRecibidos: 0, contenedoresPendientes: 0, palletsIn: 0,
        posicionesOcupadas: 0, posicionesTotales: 15000,
        palletsOutB2C: 0, palletsOutB2B: 0, pickingCompletado: 0, pickingPendiente: 0,
        jornalesPresentes: 0, jornalesTotales: 65, pickingPorJornal: 0, palletsOutPorJornal: 0,
        alertas: [],
      };
    }

    const alertas: AlertaOperativa[] = [];
    const ocupacion = match.posicionesTotales > 0 ? (match.posicionesOcupadas / match.posicionesTotales) * 100 : 0;
    if (ocupacion > 90) alertas.push({ id: 'a-ocup', tipo: 'critical', mensaje: 'Ocupación al ' + Math.round(ocupacion) + '% — redistribuir stock', hora: '08:30' });
    if (match.contenedoresPendientes > 0) alertas.push({ id: 'a-cont', tipo: 'warning', mensaje: match.contenedoresPendientes + ' contenedores pendientes de descarga', hora: '09:15' });
    const asistencia = match.jornalesTotales > 0 ? (match.jornalesPresentes / match.jornalesTotales) * 100 : 100;
    if (asistencia < 90) {
      const ausentes = match.jornalesTotales - match.jornalesPresentes;
      alertas.push({ id: 'a-jorn', tipo: 'warning', mensaje: ausentes + ' jornales ausentes — turno cubierto al ' + Math.round(asistencia) + '%', hora: '07:00' });
    }
    const pickTotal = match.pickingCompletado + match.pickingPendiente;
    const pickPct = pickTotal > 0 ? Math.round((match.pickingCompletado / pickTotal) * 100) : 0;
    if (pickPct > 80) alertas.push({ id: 'a-pick', tipo: 'info', mensaje: 'Picking completado al ' + pickPct + '% del objetivo diario', hora: '10:00' });

    return { ...match, alertas };
  },

  getSheetRaw: async (sheetName: string) => {
    return getSheetData(sheetName);
  },
};
