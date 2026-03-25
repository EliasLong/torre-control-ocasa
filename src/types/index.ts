export type Nave = 'PL2' | 'PL3' | 'todas';

// --- Auth & Users ---

export type TabPermission = 'operacional' | 'financiero' | 'merma' | 'abc-xyz' | 'torre-control' | 'reportes' | 'indicadores-diarios';

export type UserRole = 'superadmin' | 'admin' | 'viewer';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  password: string; // Phase 1 only — plain text in localStorage
  role: UserRole;
  status: UserStatus;
  tabs: TabPermission[];
  createdAt: string; // ISO date
}

export interface KPIData {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;
}

export interface PalletOut {
  fecha: string; // ISO date
  pallets: number;
  tipo: 'B2C' | 'B2B';
  planta: 'PL2' | 'PL3';
}

export interface OperacionDiaria {
  fecha: string;
  picking: number;
  pallets_in: number;
  contenedores: number;
}

export interface PersonalDiario {
  fecha: string;
  jornales: number;
}

export interface Tarifa {
  servicio: string;
  tarifa: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
}

export interface Costo {
  concepto: string;
  tipo: 'fijo' | 'variable';
  monto: number;
  vigencia_desde: string;
  vigencia_hasta: string | null;
}

// Objetivos mensuales por métrica (de Objetivo.xlsx)
export interface ObjetivosMensuales {
  contenedores: number;
  pallets_in: number;
  picking: number;
  pallets_out: number;
}

// Derived types for UI consumption
export interface OperacionalDashboardData {
  palletsOut: PalletOut[];
  operaciones: OperacionDiaria[];
  objetivos: ObjetivosMensuales;
}

export interface FacturacionDetalle {
  picking: number;
  pallets_in: number;
  pallets_out: number;
  contenedores: number;
  guarda: number;
  apertura_planta: number;
  total: number;
}

export interface CostosDetalle {
  fijos: number;
  variables: number;
  total: number;
}

export interface ResultadoDetalle {
  facturacion: number;
  costos: number;
  resultado: number;
  margen: number; // percentage
}

export interface FinancieroDiario {
  fecha: string;
  facturacion: FacturacionDetalle;
  costos: CostosDetalle;
  resultado: number;
  margen: number;
}

export interface FinancieroDashboardData {
  tarifas: Tarifa[];
  costos: Costo[];
  personalDiario: PersonalDiario[];
  operaciones: OperacionDiaria[];
  palletsOut: PalletOut[];
}

// --- Indicadores Diarios ---

export interface MovimientoRaw {
  fecha: string;
  org: 'PL2' | 'PL3';
  articulo: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  subinventario: string;
  localizador: string;
  subTransferencia: string;
  lpnTransferido: string;
  tipoOrigen: string;
  accion: string;
  tipoTransaccion: string;
  usuario: string;
  turno: string;
  lpnContenido: string;
}

export interface IndicadorDiario {
  fecha: string;
  org: 'PL2' | 'PL3' | 'Total';
  picking: number;
  recepcion: number;
  contenedores: number;
  movimientos: number;
}

export interface TurnoBreakdown {
  turno: string;
  picking: number;
  recepcion: number;
}

export interface IndicadoresDiariosData {
  resumen: IndicadorDiario[];
  turno: TurnoBreakdown[];
  movimientos: MovimientoRaw[];
  historico: IndicadorDiario[];
}
