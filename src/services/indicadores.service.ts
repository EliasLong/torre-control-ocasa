import { fetchSheetRows, parseSheetDate, getOperacionesFromSql } from '@/lib/raw-sources';
import type { MovimientoRaw, IndicadorDiario, TurnoBreakdown } from '@/types';

const SHEET_MOVIMIENTOS = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk';

const TURNOS_VALIDOS = ['MAÑANA', 'TARDE'];

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
  const turno = (row[turnoIndex] || '').trim().toUpperCase();

  // Solo turnos MAÑANA y TARDE
  if (!TURNOS_VALIDOS.includes(turno)) return null;

  return {
    fecha,
    org,
    articulo: cleanArticulo(row[2]),
    descripcion: row[3] || '',
    cantidad: parseNumericField(row[4]),
    costo: parseNumericField(row[5]),
    subinventario: (row[7] || '').trim().toUpperCase(),
    localizador: row[8] || '',
    subTransferencia: (row[9] || '').trim().toUpperCase(),
    lpnTransferido: (row[10] || '').trim(),
    tipoOrigen: (row[11] || '').trim(),
    accion: (row[12] || '').trim(),
    tipoTransaccion: (row[13] || '').trim(),
    usuario: (row[14] || '').trim(),
    turno,
    lpnContenido: (row[16] || '').trim(),
  };
}

function isPicking(mov: MovimientoRaw): boolean {
  return (
    mov.tipoTransaccion.toLowerCase() === 'sales order pick' &&
    mov.subTransferencia === 'PORTONES'
  );
}

function isRecepcion(mov: MovimientoRaw): boolean {
  return mov.subinventario === 'RECEPCION';
}

function isMovimientoTransfer(mov: MovimientoRaw): boolean {
  return mov.tipoTransaccion.toLowerCase() === 'subinventory transfer';
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
 * Build resumen from movimientos del día.
 * - Picking: Sales Order Pick + subTransferencia PORTONES
 * - Recepción: subinventario RECEPCION (unidades)
 * - Contenedores: distinct lpnContenido de RECEPCION
 * - Movimientos: Subinventory Transfer
 */
export function buildResumen(
  fecha: string,
  movimientos: MovimientoRaw[],
): IndicadorDiario[] {
  const pl2: IndicadorDiario = { fecha, org: 'PL2', picking: 0, recepcion: 0, contenedores: 0, movimientos: 0 };
  const pl3: IndicadorDiario = { fecha, org: 'PL3', picking: 0, recepcion: 0, contenedores: 0, movimientos: 0 };

  const lpnSetPL2 = new Set<string>();
  const lpnSetPL3 = new Set<string>();

  for (const mov of movimientos) {
    const entry = mov.org === 'PL2' ? pl2 : pl3;
    const lpnSet = mov.org === 'PL2' ? lpnSetPL2 : lpnSetPL3;

    if (isPicking(mov)) {
      entry.picking += Math.abs(mov.cantidad);
    }

    if (isRecepcion(mov)) {
      entry.recepcion += Math.abs(mov.cantidad);
      if (mov.lpnContenido) {
        lpnSet.add(mov.lpnContenido);
      }
    }

    if (isMovimientoTransfer(mov)) {
      entry.movimientos += Math.abs(mov.cantidad);
    }
  }

  pl2.contenedores = lpnSetPL2.size;
  pl3.contenedores = lpnSetPL3.size;

  const total: IndicadorDiario = {
    fecha,
    org: 'Total',
    picking: pl2.picking + pl3.picking,
    recepcion: pl2.recepcion + pl3.recepcion,
    contenedores: pl2.contenedores + pl3.contenedores,
    movimientos: pl2.movimientos + pl3.movimientos,
  };

  return [pl2, pl3, total];
}

export function getTurnoBreakdown(movimientos: MovimientoRaw[]): TurnoBreakdown[] {
  const turnoMap = new Map<string, { picking: number; recepcion: number }>();

  for (const mov of movimientos) {
    const turno = mov.turno;

    let isP = false;
    let isR = false;

    if (isPicking(mov)) isP = true;
    if (isRecepcion(mov)) isR = true;

    if (!isP && !isR) continue;

    let entry = turnoMap.get(turno);
    if (!entry) {
      entry = { picking: 0, recepcion: 0 };
      turnoMap.set(turno, entry);
    }

    const absQty = Math.abs(mov.cantidad);
    if (isP) entry.picking += absQty;
    if (isR) entry.recepcion += absQty;
  }

  return Array.from(turnoMap.entries()).map(([turno, data]) => ({
    turno,
    picking: data.picking,
    recepcion: data.recepcion,
  }));
}

/**
 * Build 30-day history from operaciones_sql.
 * Returns Total-level IndicadorDiario[].
 */
export async function buildHistorico(fecha: string): Promise<IndicadorDiario[]> {
  const operaciones = await getOperacionesFromSql();

  const startDate = new Date(fecha);
  startDate.setDate(startDate.getDate() - 30);
  const startStr = startDate.toISOString().split('T')[0];

  return operaciones
    .filter(o => o.fecha >= startStr && o.fecha <= fecha)
    .map(o => ({
      fecha: o.fecha,
      org: 'Total' as const,
      picking: o.picking,
      recepcion: o.pallets_in,
      contenedores: o.contenedores,
      movimientos: 0,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Fetch all data for indicadores diarios.
 * Called once from the API route.
 */
export async function fetchAllIndicadoresData(fecha: string) {
  const [movimientos, historico] = await Promise.all([
    getMovimientosDelDia(fecha),
    buildHistorico(fecha),
  ]);

  const resumen = buildResumen(fecha, movimientos);
  const turno = getTurnoBreakdown(movimientos);

  return { resumen, turno, movimientos, historico };
}
