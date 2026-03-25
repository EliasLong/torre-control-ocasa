import {
  OperacionDiaria,
  PalletOut,
  Tarifa,
  Costo,
  PersonalDiario,
  FacturacionDetalle,
  CostosDetalle,
  ResultadoDetalle,
} from '@/types';

export function calcularRentabilidad(venta: number, costo: number): number {
  if (venta === 0) return 0;
  return ((venta - costo) / venta) * 100;
}

export function calcularMermaPorc(montoMerma: number, totalDespachos: number): number {
  if (totalDespachos === 0) return 0;
  return montoMerma / totalDespachos;
}

export function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString('es-AR')}`;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function calcularPalletsIn(cantidad: number): number {
  if (cantidad <= 50) return Math.ceil(cantidad / 2);
  if (cantidad <= 100) return Math.ceil(cantidad / 3);
  if (cantidad <= 200) return Math.ceil(cantidad / 4);
  if (cantidad <= 300) return Math.ceil(cantidad / 6);
  if (cantidad <= 400) return Math.ceil(cantidad / 8);
  if (cantidad <= 500) return Math.ceil(cantidad / 12);
  if (cantidad <= 600) return Math.ceil(cantidad / 14);
  return Math.ceil(cantidad / 18);
}

// Helper: check if a date string is a Saturday
function esSabado(fechaStr: string): boolean {
  const date = new Date(fechaStr + 'T12:00:00');
  return date.getDay() === 6;
}

// Helper: get days in month from a date string
function diasEnMes(fechaStr: string): number {
  const date = new Date(fechaStr + 'T12:00:00');
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

// Helper: find tarifa by normalized name (case-insensitive, spaces to underscores, flexible matching)
function findTarifaValue(tarifas: Tarifa[], servicio: string): number {
  const norm = servicio.toLowerCase().replace(/\s+/g, '_');
  const t = tarifas.find(item => {
    const itemNorm = item.servicio.toLowerCase().replace(/\s+/g, '_');
    return itemNorm === norm || itemNorm.startsWith(norm) || norm.startsWith(itemNorm);
  });
  return t?.tarifa ?? 0;
}

// Facturacion:
// - picking, pallet_in, pallet_out, contenedores: volumen x tarifa unitaria
// - guarda: tarifa mensual fija (no se prorratea)
// - apertura_planta: tarifa x cantidad de sabados en el periodo
export function calcularFacturacion(
  operaciones: OperacionDiaria[],
  palletsOut: PalletOut[],
  tarifas: Tarifa[]
): FacturacionDetalle {
  const getTarifa = (servicio: string) => findTarifaValue(tarifas, servicio);

  const totalPicking = operaciones.reduce((sum, o) => sum + o.picking, 0);
  const totalPalletsIn = operaciones.reduce((sum, o) => sum + o.pallets_in, 0);
  const totalContenedores = operaciones.reduce((sum, o) => sum + o.contenedores, 0);
  const totalPalletsOut = palletsOut.reduce((sum, p) => sum + p.pallets, 0);

  const picking = totalPicking * getTarifa('picking');
  const pallets_in = totalPalletsIn * getTarifa('pallet_in');
  const pallets_out = totalPalletsOut * getTarifa('pallet_out');
  const contenedores = totalContenedores * getTarifa('contenedor');

  // Guarda: tarifa mensual fija, no se divide por dias
  const guarda = getTarifa('guarda');

  // Apertura de planta: tarifa x sabados en el periodo
  const tarifaApertura = getTarifa('apertura');
  const sabadosEnPeriodo = operaciones.filter(o => esSabado(o.fecha)).length;
  const apertura_planta = tarifaApertura * sabadosEnPeriodo;

  const total = picking + pallets_in + pallets_out + contenedores + guarda + apertura_planta;

  return { picking, pallets_in, pallets_out, contenedores, guarda, apertura_planta, total };
}

export function calcularCostos(
  costosFijos: Costo[],
  costosVariables: Costo[],
  jornales: PersonalDiario[],
  _diasEnPeriodo?: number
): CostosDetalle {
  // Costos fijos son mensuales - se muestran completos, sin prorrateo
  const fijos = costosFijos.reduce((sum, c) => sum + c.monto, 0);

  const costoVariableUnitario = costosVariables.reduce((sum, c) => sum + c.monto, 0);
  const totalJornales = jornales.reduce((sum, j) => sum + j.jornales, 0);
  const variables = costoVariableUnitario * totalJornales;

  return { fijos, variables, total: fijos + variables };
}

export function calcularResultado(facturacion: number, costos: number): ResultadoDetalle {
  const resultado = facturacion - costos;
  const margen = facturacion === 0 ? 0 : (resultado / facturacion) * 100;
  return { facturacion, costos, resultado, margen };
}
