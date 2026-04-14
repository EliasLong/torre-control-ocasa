import { fetchSheetRows, parseSheetDate } from '@/lib/raw-sources';
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

  if (!TURNOS_VALIDOS.includes(turno)) return null;

  return {
    fecha,
    org,
    articulo: cleanArticulo(row[2]),
    descripcion: row[3] || '',
    cantidad: parseNumericField(row[4]),
    costo: parseNumericField(row[5]),
    subinventario: (row[7] || '').trim().toUpperCase(),
    localizador: (row[8] || '').trim(),
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

// --- Filters ---

export function isPicking(mov: MovimientoRaw): boolean {
  return (
    mov.tipoTransaccion.toLowerCase() === 'sales order pick' &&
    mov.subTransferencia === 'PORTONES'
  );
}

export function isRecepcion(mov: MovimientoRaw): boolean {
  return (
    mov.subinventario === 'RECEPCION' &&
    mov.tipoTransaccion.toLowerCase() === 'direct org transfer sin remito'
  );
}

export function isRMA(mov: MovimientoRaw): boolean {
  return (
    mov.subinventario === 'RECEPCION' &&
    mov.tipoTransaccion.toLowerCase() === 'rma receipt'
  );
}

export function isMovimientoTransfer(mov: MovimientoRaw): boolean {
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
 * - Recepción: subinventario RECEPCION + Direct Org Transfer Sin Remito
 * - Contenedores: distinct lpnContenido de recepción
 */
export function buildResumen(
  fecha: string,
  movimientos: MovimientoRaw[],
): IndicadorDiario[] {
  const pl2: IndicadorDiario = { fecha, org: 'PL2', picking: 0, recepcion: 0, contenedores: 0 };
  const pl3: IndicadorDiario = { fecha, org: 'PL3', picking: 0, recepcion: 0, contenedores: 0 };

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
  }

  pl2.contenedores = lpnSetPL2.size;
  pl3.contenedores = lpnSetPL3.size;

  const total: IndicadorDiario = {
    fecha,
    org: 'Total',
    picking: pl2.picking + pl3.picking,
    recepcion: pl2.recepcion + pl3.recepcion,
    contenedores: pl2.contenedores + pl3.contenedores,
  };

  return [pl2, pl3, total];
}

export function getTurnoBreakdown(movimientos: MovimientoRaw[]): TurnoBreakdown[] {
  const turnoMap = new Map<string, number>();

  for (const mov of movimientos) {
    if (!isPicking(mov)) continue;
    const turno = mov.turno;
    turnoMap.set(turno, (turnoMap.get(turno) ?? 0) + Math.abs(mov.cantidad));
  }

  return Array.from(turnoMap.entries()).map(([turno, picking]) => ({
    turno,
    picking,
  }));
}

/**
 * Fetch all data for indicadores diarios.
 */
export async function fetchAllIndicadoresData(fecha: string) {
  const movimientos = await getMovimientosDelDia(fecha);
  const resumen = buildResumen(fecha, movimientos);
  const turno = getTurnoBreakdown(movimientos);

  return { resumen, turno, movimientos };
}
