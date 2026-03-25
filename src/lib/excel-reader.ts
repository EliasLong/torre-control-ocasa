import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

import type { RawMovimiento } from '@/types/abcxyz.types';

// Oracle ERP precision divisors differ by report type
const MOVIMIENTOS_DIVISOR = 10_000_000_000; // Movimientos: 10^10
const WAREHOUSE_DIVISOR = 100_000;          // Mapas warehouse: 10^5

// Module-level cache so files are only read once
const movimientosCache = new Map<string, RawMovimiento[]>();
const warehouseMapCache = new Map<
  string,
  Map<string, { cantidad: number; valorizado: number; descripcion: string }>
>();

export function readMovimientos(filePath: string): RawMovimiento[] {
  const resolved = path.resolve(process.cwd(), filePath);

  if (movimientosCache.has(resolved)) {
    return movimientosCache.get(resolved)!;
  }

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved} (cwd: ${process.cwd()})`);
  }

  const fileBuffer = fs.readFileSync(resolved);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  // Skip header row (index 0)
  const data: RawMovimiento[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Column mapping based on header:
    // 0: rowIndex, 1: Fecha, 2: Codigo_Organizacion, 3: Articulo,
    // 4: Descripcion, 5: Cantidad_Transaccion, 6: Costo_Total_Transaccion,
    // ... 16: Tipo_Transaccion
    data.push({
      fecha: String(row[1]),
      codigoOrganizacion: String(row[2]),
      articulo: String(row[3]),
      descripcion: String(row[4]),
      cantidadTransaccion: Number(row[5]),
      costoTotalTransaccion: Number(row[6]) / MOVIMIENTOS_DIVISOR,
      tipoTransaccion: String(row[16]),
    });
  }

  movimientosCache.set(resolved, data);
  return data;
}

export function readWarehouseMap(
  filePath: string,
): Map<string, { cantidad: number; valorizado: number; descripcion: string }> {
  const resolved = path.resolve(process.cwd(), filePath);

  if (warehouseMapCache.has(resolved)) {
    return warehouseMapCache.get(resolved)!;
  }

  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved} (cwd: ${process.cwd()})`);
  }

  const fileBuffer = fs.readFileSync(resolved);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  const result = new Map<
    string,
    { cantidad: number; valorizado: number; descripcion: string }
  >();

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Column mapping:
    // 0: Codigo, 1: Descripción, 2: Udm, 3: Descripcion,
    // 4: Cantidad, 5: Costo, 6: Total, 7: Subinventario, 8: Localizador

    // Codigo has ="..." format — strip it
    const sku = String(row[0])
      .replace(/^="?|"?$/g, '')
      .trim();

    if (!sku) continue;

    const cantidad = Number(row[4]) || 0;
    const valorizado = (Number(row[6]) || 0) / WAREHOUSE_DIVISOR;
    const descripcion = String(row[1] ?? '');

    const existing = result.get(sku);

    if (existing) {
      existing.cantidad += cantidad;
      existing.valorizado += valorizado;
    } else {
      result.set(sku, { cantidad, valorizado, descripcion });
    }
  }

  warehouseMapCache.set(resolved, result);
  return result;
}
