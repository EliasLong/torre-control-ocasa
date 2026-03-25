// Torre de Control — Daily snapshot mock data for "today" (2026-03-18)
export interface TorreControlData {
  fecha: string;
  // Inbound
  contenedoresRecibidos: number;
  contenedoresPendientes: number;
  palletsIn: number;
  // Storage
  posicionesOcupadas: number;
  posicionesTotales: number;
  // Outbound
  palletsOutB2C: number;
  palletsOutB2B: number;
  pickingCompletado: number;
  pickingPendiente: number;
  // Workforce
  jornalesPresentes: number;
  jornalesTotales: number;
  // Productivity
  pickingPorJornal: number;
  palletsOutPorJornal: number;
  // Alerts
  alertas: AlertaOperativa[];
}

export interface AlertaOperativa {
  id: string;
  tipo: 'warning' | 'critical' | 'info';
  mensaje: string;
  hora: string;
}

export const torreControlMock: TorreControlData = {
  fecha: '2026-03-18',
  // Inbound
  contenedoresRecibidos: 6,
  contenedoresPendientes: 2,
  palletsIn: 245,
  // Storage
  posicionesOcupadas: 12450,
  posicionesTotales: 15000,
  // Outbound
  palletsOutB2C: 180,
  palletsOutB2B: 95,
  pickingCompletado: 1320,
  pickingPendiente: 280,
  // Workforce
  jornalesPresentes: 58,
  jornalesTotales: 65,
  // Productivity
  pickingPorJornal: 22.8,
  palletsOutPorJornal: 4.7,
  // Alerts
  alertas: [
    { id: 'a1', tipo: 'critical', mensaje: 'Zona A3 al 95% de capacidad — redistribuir stock', hora: '08:30' },
    { id: 'a2', tipo: 'warning', mensaje: '2 contenedores pendientes de descarga (demora proveedor)', hora: '09:15' },
    { id: 'a3', tipo: 'info', mensaje: 'Picking B2C adelantado 12% respecto a objetivo diario', hora: '10:00' },
    { id: 'a4', tipo: 'warning', mensaje: '7 jornales ausentes hoy — turno cubierto al 89%', hora: '07:00' },
  ],
};
