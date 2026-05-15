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

function parseRowToMovimiento(row: string[], org: 'PL2' | 'PL3', indices: any): MovimientoRaw | null {
  const fecha = parseSheetDate(row[indices.fecha]);
  if (!fecha) return null;

  const turno = (row[indices.turno] || '').trim().toUpperCase();
  if (!TURNOS_VALIDOS.includes(turno)) return null;

  return {
    fecha,
    org,
    articulo: cleanArticulo(row[indices.articulo]),
    descripcion: row[indices.descripcion] || '',
    cantidad: parseNumericField(row[indices.cantidad]),
    costo: parseNumericField(row[indices.costo]),
    subinventario: (row[indices.subinventario] || '').trim().toUpperCase(),
    localizador: (row[indices.localizador] || '').trim(),
    subTransferencia: (row[indices.subTransferencia] || '').trim().toUpperCase(),
    lpnTransferido: (row[indices.lpnTransferido] || '').trim(),
    tipoOrigen: (row[indices.tipoOrigen] || '').trim(),
    accion: (row[indices.accion] || '').trim(),
    tipoTransaccion: (row[indices.tipoTransaccion] || '').trim(),
    usuario: (row[indices.usuario] || '').trim(),
    turno,
    lpnContenido: (row[indices.lpnContenido] || '').trim(),
    cliente: (row[indices.cliente] || '').trim().toUpperCase(),
  };
}

function getColumnIndices(header: string[]) {
  const find = (names: string[]) => {
    const hUpper = header.map(h => h.toUpperCase().trim());
    for (const name of names) {
      const idx = hUpper.findIndex(h => h.includes(name.toUpperCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  return {
    fecha: find(['FECHA DE TRANSACCION', 'FECHA']),
    articulo: find(['ARTICULO']),
    descripcion: find(['DESCRIPCION']),
    cantidad: find(['CANTIDAD']),
    costo: find(['COSTO']),
    subinventario: find(['SUBINVENTARIO']),
    localizador: find(['LOCALIZADOR']),
    subTransferencia: find(['SUBINVENTARIO TRANSFERENCIA', 'SUB TRANSFERENCIA']),
    lpnTransferido: find(['LPN TRANSFERIDO']),
    tipoOrigen: find(['TIPO DE ORIGEN']),
    accion: find(['ACCION']),
    tipoTransaccion: find(['TIPO DE TRANSACCION']),
    usuario: find(['USUARIO']),
    turno: find(['TURNO']),
    lpnContenido: find(['LPN CONTENIDO']),
    cliente: find(['CLIENTE']),
  };
}

// --- Filters ---

export function isPicking(mov: MovimientoRaw): boolean {
  return (
    mov.tipoTransaccion.toLowerCase().includes('sales order pick') &&
    mov.subTransferencia.toUpperCase().includes('PORTONES')
  );
}

export function isRecepcion(mov: MovimientoRaw): boolean {
  return (
    mov.subinventario.toUpperCase().includes('RECEPCION') &&
    mov.tipoTransaccion.toLowerCase().includes('direct org transfer sin remito')
  );
}

export function isRMA(mov: MovimientoRaw): boolean {
  return (
    mov.subinventario.toUpperCase().includes('RECEPCION') &&
    mov.tipoTransaccion.toLowerCase().includes('rma receipt')
  );
}

export function isMovimientoTransfer(mov: MovimientoRaw): boolean {
  return mov.tipoTransaccion.toLowerCase().includes('subinventory transfer');
}

// --- Public API ---

export async function getMovimientosDelDia(fecha: string): Promise<MovimientoRaw[]> {
  return getMovimientosPorFechas([fecha]);
}

export async function getMovimientosPorFechas(fechas: string[]): Promise<MovimientoRaw[]> {
  const [pl2Rows, pl3Rows] = await Promise.all([
    fetchSheetRows(SHEET_MOVIMIENTOS, 'PL2'),
    fetchSheetRows(SHEET_MOVIMIENTOS, 'PL3'),
  ]);

  const setFechas = new Set(fechas);
  const movimientos: MovimientoRaw[] = [];

  if (pl2Rows.length > 0) {
    const idx = getColumnIndices(pl2Rows[0]);
    for (let i = 1; i < pl2Rows.length; i++) {
      const mov = parseRowToMovimiento(pl2Rows[i], 'PL2', idx);
      if (mov && setFechas.has(mov.fecha)) movimientos.push(mov);
    }
  }

  if (pl3Rows.length > 0) {
    const idx = getColumnIndices(pl3Rows[0]);
    for (let i = 1; i < pl3Rows.length; i++) {
      const mov = parseRowToMovimiento(pl3Rows[i], 'PL3', idx);
      if (mov && setFechas.has(mov.fecha)) movimientos.push(mov);
    }
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
