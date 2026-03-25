import { fetchSheetRows, parseSheetDate, getOperacionesFromSql, getPalletsOutFromSheets } from '@/lib/raw-sources';
import type { MovimientoRaw, IndicadorDiario, TurnoBreakdown, OperacionDiaria, PalletOut } from '@/types';

const SHEET_MOVIMIENTOS = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk';

// --- Helpers ---

function cleanArticulo(raw: string): string {
  if (!raw) return '';
  let val = raw.trim();
  if (val.startsWith('="')) val = val.slice(2);
  if (val.endsWith('"')) val = val.slice(0, -1);
  return val;
}

function parseNumericField(raw: string | undefined): number {
  if (!raw || raw.trim() === '') return 0;
  return parseFloat(raw.replace(',', '.')) || 0;
}

function parseRowToMovimiento(row: string[], org: 'PL2' | 'PL3'): MovimientoRaw | null {
  const fecha = parseSheetDate(row[0]);
  if (!fecha) return null;

  const turnoIndex = org === 'PL2' ? 15 : 18;

  return {
    fecha,
    org,
    articulo: cleanArticulo(row[2]),
    descripcion: row[3] || '',
    cantidad: parseNumericField(row[4]),
    costo: parseNumericField(row[5]),
    subinventario: row[7] || '',
    localizador: row[8] || '',
    subTransferencia: row[9] || '',
    lpnTransferido: row[10] || '',
    tipoOrigen: row[11] || '',
    accion: row[12] || '',
    tipoTransaccion: row[13] || '',
    usuario: row[14] || '',
    turno: row[turnoIndex] || '',
    lpnContenido: row[16] || '',
  };
}

// --- Public API ---

export async function getMovimientosDelDia(fecha: string): Promise<MovimientoRaw[]> {
  const [pl2Rows, pl3Rows] = await Promise.all([
    fetchSheetRows(SHEET_MOVIMIENTOS, 'PL2'),
    fetchSheetRows(SHEET_MOVIMIENTOS, 'PL3'),
  ]);

  const movimientos: MovimientoRaw[] = [];

  for (let i = 1; i < pl2Rows.length; i++) {
    const mov = parseRowToMovimiento(pl2Rows[i], 'PL2');
    if (mov && mov.fecha === fecha) movimientos.push(mov);
  }

  for (let i = 1; i < pl3Rows.length; i++) {
    const mov = parseRowToMovimiento(pl3Rows[i], 'PL3');
    if (mov && mov.fecha === fecha) movimientos.push(mov);
  }

  return movimientos;
}

/**
 * Build resumen from pre-fetched data (no Acumulado sheet needed).
 * - Picking per org: from raw movimientos (Sales Order Pick)
 * - Pallet In per org: count receipt transactions from raw
 * - Pallet Out per org: from B2C/B2B sheets
 * - Contenedores: from operaciones_sql (n8n → SQL Server aggregate)
 */
export function buildResumen(
  fecha: string,
  movimientos: MovimientoRaw[],
  operaciones: OperacionDiaria[],
  palletsOut: PalletOut[],
): IndicadorDiario[] {
  const pl2: IndicadorDiario = { fecha, org: 'PL2', picking: 0, pallet_in: 0, pallet_out: 0, contenedores: 0 };
  const pl3: IndicadorDiario = { fecha, org: 'PL3', picking: 0, pallet_in: 0, pallet_out: 0, contenedores: 0 };

  for (const mov of movimientos) {
    const entry = mov.org === 'PL2' ? pl2 : pl3;
    const tipo = mov.tipoTransaccion.toLowerCase();

    if (tipo === 'sales order pick') {
      entry.picking += Math.abs(mov.cantidad);
    }
    if (tipo.includes('direct org transfer')) {
      entry.pallet_in += 1;
    }
  }

  // Pallet out per org from B2C/B2B sheets
  for (const p of palletsOut) {
    if (p.fecha !== fecha) continue;
    if (p.planta === 'PL2') pl2.pallet_out += p.pallets;
    if (p.planta === 'PL3') pl3.pallet_out += p.pallets;
  }

  // Use operaciones_sql for accurate total picking/pallets_in/contenedores
  const opDia = operaciones.find(o => o.fecha === fecha);

  const total: IndicadorDiario = {
    fecha,
    org: 'Total',
    picking: opDia?.picking ?? (pl2.picking + pl3.picking),
    pallet_in: opDia?.pallets_in ?? (pl2.pallet_in + pl3.pallet_in),
    pallet_out: pl2.pallet_out + pl3.pallet_out,
    contenedores: opDia?.contenedores ?? 0,
  };

  return [pl2, pl3, total];
}

export function getTurnoBreakdown(movimientos: MovimientoRaw[]): TurnoBreakdown[] {
  const turnoMap = new Map<string, { picking: number; recepcion: number }>();

  for (const mov of movimientos) {
    const turno = mov.turno || 'SIN TURNO';
    const tipoLower = mov.tipoTransaccion.toLowerCase();

    let isPicking = false;
    let isRecepcion = false;

    if (tipoLower === 'sales order pick') {
      isPicking = true;
    } else if (tipoLower === 'direct org transfer' || tipoLower === 'direct org transfer sin remito') {
      isRecepcion = true;
    }

    if (!isPicking && !isRecepcion) continue;

    let entry = turnoMap.get(turno);
    if (!entry) {
      entry = { picking: 0, recepcion: 0 };
      turnoMap.set(turno, entry);
    }

    const absQty = Math.abs(mov.cantidad);
    if (isPicking) entry.picking += absQty;
    if (isRecepcion) entry.recepcion += absQty;
  }

  return Array.from(turnoMap.entries()).map(([turno, data]) => ({
    turno,
    picking: data.picking,
    recepcion: data.recepcion,
  }));
}

/**
 * Build 30-day history from operaciones_sql + B2C/B2B pallet out.
 * Returns Total-level IndicadorDiario[] (no per-org breakdown for history).
 */
export function buildHistorico(
  fecha: string,
  operaciones: OperacionDiaria[],
  palletsOut: PalletOut[],
): IndicadorDiario[] {
  const startDate = new Date(fecha);
  startDate.setDate(startDate.getDate() - 30);
  const startStr = startDate.toISOString().split('T')[0];

  // Build pallet_out map by date
  const palletOutMap = new Map<string, number>();
  for (const p of palletsOut) {
    if (p.fecha < startStr || p.fecha > fecha) continue;
    palletOutMap.set(p.fecha, (palletOutMap.get(p.fecha) || 0) + p.pallets);
  }

  return operaciones
    .filter(o => o.fecha >= startStr && o.fecha <= fecha)
    .map(o => ({
      fecha: o.fecha,
      org: 'Total' as const,
      picking: o.picking,
      pallet_in: o.pallets_in,
      pallet_out: palletOutMap.get(o.fecha) || 0,
      contenedores: o.contenedores,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Fetch all shared data sources in parallel.
 * Called once from the API route to avoid redundant sheet reads.
 */
export async function fetchAllIndicadoresData(fecha: string) {
  const [movimientos, operaciones, palletsOut] = await Promise.all([
    getMovimientosDelDia(fecha),
    getOperacionesFromSql(),
    getPalletsOutFromSheets(),
  ]);

  const resumen = buildResumen(fecha, movimientos, operaciones, palletsOut);
  const turno = getTurnoBreakdown(movimientos);
  const historico = buildHistorico(fecha, operaciones, palletsOut);

  return { resumen, turno, movimientos, historico };
}
