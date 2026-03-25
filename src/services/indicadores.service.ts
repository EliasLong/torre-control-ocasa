import { fetchSheetRows, parseSheetDate } from '@/lib/raw-sources';
import type { MovimientoRaw, IndicadorDiario, TurnoBreakdown } from '@/types';

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

  // Skip header row (index 0)
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

export async function getResumenDelDia(fecha: string): Promise<IndicadorDiario[]> {
  const rows = await fetchSheetRows(SHEET_MOVIMIENTOS, 'Acumulado');
  if (rows.length < 2) return [];

  // Group by date+org
  const map = new Map<string, IndicadorDiario>();

  const getOrCreate = (f: string, org: 'PL2' | 'PL3' | 'Total'): IndicadorDiario => {
    const key = `${f}|${org}`;
    let entry = map.get(key);
    if (!entry) {
      entry = { fecha: f, org, picking: 0, pallet_in: 0, pallet_out: 0, contenedores: 0 };
      map.set(key, entry);
    }
    return entry;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowFecha = parseSheetDate(row[0]);
    if (!rowFecha || rowFecha !== fecha) continue;

    const org = (row[1] || '').trim() as 'PL2' | 'PL3' | 'Total';
    const tipo = (row[2] || '').trim();
    const proceso = (row[3] || '').trim();
    const suma = parseNumericField(row[4]);
    const pallets = parseNumericField(row[5]);

    if (org === 'PL2' || org === 'PL3') {
      const entry = getOrCreate(rowFecha, org);
      if (tipo === 'SALES ORDER PICK' && proceso === 'ALMACEN') {
        entry.picking = suma;
      } else if (tipo === '' && proceso === 'RECEPCION') {
        entry.pallet_in = pallets;
      }
    }

    if (org === 'Total') {
      const entry = getOrCreate(rowFecha, 'Total');
      if (tipo === 'Contenedores') {
        entry.contenedores = suma;
      } else if (tipo === 'Pallet OUT') {
        entry.pallet_out = pallets;
      }
    }
  }

  // Build Total row aggregating PL2+PL3 picking/pallet_in if not already set
  const pl2 = map.get(`${fecha}|PL2`);
  const pl3 = map.get(`${fecha}|PL3`);
  const total = getOrCreate(fecha, 'Total');
  total.picking = (pl2?.picking || 0) + (pl3?.picking || 0);
  total.pallet_in = (pl2?.pallet_in || 0) + (pl3?.pallet_in || 0);

  return Array.from(map.values());
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

export async function getHistorico30Dias(fecha: string): Promise<IndicadorDiario[]> {
  const endDate = new Date(fecha);
  const startDate = new Date(fecha);
  startDate.setDate(startDate.getDate() - 30);
  const startStr = startDate.toISOString().split('T')[0];

  const rows = await fetchSheetRows(SHEET_MOVIMIENTOS, 'Acumulado');
  if (rows.length < 2) return [];

  const map = new Map<string, IndicadorDiario>();

  const getOrCreate = (f: string, org: 'PL2' | 'PL3' | 'Total'): IndicadorDiario => {
    const key = `${f}|${org}`;
    let entry = map.get(key);
    if (!entry) {
      entry = { fecha: f, org, picking: 0, pallet_in: 0, pallet_out: 0, contenedores: 0 };
      map.set(key, entry);
    }
    return entry;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowFecha = parseSheetDate(row[0]);
    if (!rowFecha || rowFecha < startStr || rowFecha > fecha) continue;

    const org = (row[1] || '').trim() as 'PL2' | 'PL3' | 'Total';
    const tipo = (row[2] || '').trim();
    const proceso = (row[3] || '').trim();
    const suma = parseNumericField(row[4]);
    const pallets = parseNumericField(row[5]);

    if (org === 'PL2' || org === 'PL3') {
      const entry = getOrCreate(rowFecha, org);
      if (tipo === 'SALES ORDER PICK' && proceso === 'ALMACEN') {
        entry.picking = suma;
      } else if (tipo === '' && proceso === 'RECEPCION') {
        entry.pallet_in = pallets;
      }
    }

    if (org === 'Total') {
      const entry = getOrCreate(rowFecha, 'Total');
      if (tipo === 'Contenedores') {
        entry.contenedores = suma;
      } else if (tipo === 'Pallet OUT') {
        entry.pallet_out = pallets;
      }
    }
  }

  // Aggregate PL2+PL3 into Total rows
  const fechas = new Set<string>();
  for (const entry of map.values()) {
    fechas.add(entry.fecha);
  }

  for (const f of fechas) {
    const pl2 = map.get(`${f}|PL2`);
    const pl3 = map.get(`${f}|PL3`);
    const total = getOrCreate(f, 'Total');
    total.picking = (pl2?.picking || 0) + (pl3?.picking || 0);
    total.pallet_in = (pl2?.pallet_in || 0) + (pl3?.pallet_in || 0);
  }

  return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
