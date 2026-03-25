import { readMovimientos, readWarehouseMap } from '@/lib/excel-reader';
import { processAbcXyz } from '@/lib/abcxyz-engine';
import type { AbcXyzResponse } from '@/types/abcxyz.types';

const BASE_PATH = 'Bases Matriz';

const FILES = {
  movimientos: `${BASE_PATH}/Movimientos.xlsx`,
  pl2Inicio: `${BASE_PATH}/Mapa PL2 Febrero/XXINRSAR_141579747_1.xls`,
  pl2Fin: `${BASE_PATH}/Mapa PL2 Febrero/XXINRSAR_142888148_1.xls`,
  pl3Inicio: `${BASE_PATH}/Mapa PL3 Febrero/XXINRSAR_141402665_1.xls`,
  pl3Fin: `${BASE_PATH}/Mapa PL3 Febrero/XXINRSAR_142888144_1.xls`,
};

let cachedResponse: Map<string, AbcXyzResponse> = new Map();

export async function getAbcXyzData(nave?: string): Promise<AbcXyzResponse> {
  const cacheKey = nave || 'todas';
  if (cachedResponse.has(cacheKey)) {
    return cachedResponse.get(cacheKey)!;
  }

  const movimientos = readMovimientos(FILES.movimientos);

  // Stock inicio de mes
  const stockPl2Inicio = readWarehouseMap(FILES.pl2Inicio);
  const stockPl3Inicio = readWarehouseMap(FILES.pl3Inicio);

  // Stock fin de mes
  const stockPl2Fin = readWarehouseMap(FILES.pl2Fin);
  const stockPl3Fin = readWarehouseMap(FILES.pl3Fin);

  // Merge PL2 + PL3 para inicio de mes
  const stockInicioMap = new Map<string, { cantidad: number; valorizado: number; descripcion: string }>();
  for (const [sku, data] of stockPl2Inicio) {
    stockInicioMap.set(sku, { ...data });
  }
  for (const [sku, data] of stockPl3Inicio) {
    const existing = stockInicioMap.get(sku);
    if (existing) {
      existing.cantidad += data.cantidad;
      existing.valorizado += data.valorizado;
    } else {
      stockInicioMap.set(sku, { ...data });
    }
  }

  // Merge PL2 + PL3 para fin de mes
  const stockFinMap = new Map<string, { cantidad: number; valorizado: number; descripcion: string }>();
  for (const [sku, data] of stockPl2Fin) {
    stockFinMap.set(sku, { ...data });
  }
  for (const [sku, data] of stockPl3Fin) {
    const existing = stockFinMap.get(sku);
    if (existing) {
      existing.cantidad += data.cantidad;
      existing.valorizado += data.valorizado;
    } else {
      stockFinMap.set(sku, { ...data });
    }
  }

  const result = processAbcXyz({
    movimientos,
    stockInicioMap,
    stockFinMap,
    nave: nave === 'todas' ? undefined : nave,
  });

  cachedResponse.set(cacheKey, result);
  return result;
}
