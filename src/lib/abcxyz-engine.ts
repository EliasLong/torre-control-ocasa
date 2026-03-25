import type {
  AbcCategory,
  XyzCategory,
  SkuAggregated,
  SkuClassified,
  MatrixCell,
  AbcXyzResponse,
} from '@/types/abcxyz.types';
import { ABC_ORDER, XYZ_ORDER } from '@/types/abcxyz.types';

// ---------------------------------------------------------------------------
// 1. countBusinessDays
// ---------------------------------------------------------------------------

/**
 * Given an array of date strings in "YYYYMMDD" format, count the distinct
 * business days (excluding Saturday=6 and Sunday=0).
 */
export function countBusinessDays(dateStrings: string[]): number {
  const unique = new Set(dateStrings);
  let count = 0;

  for (const s of unique) {
    const date = new Date(
      parseInt(s.slice(0, 4)),
      parseInt(s.slice(4, 6)) - 1,
      parseInt(s.slice(6, 8)),
    );
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// 2. classifyAbc
// ---------------------------------------------------------------------------

/**
 * Classify SKUs into ABC categories based on cumulative dispatched value.
 * A+ <= 15%, A <= 80%, B <= 95%, C <= 98%, C- = rest.
 * SKUs with 0 dispatched value are assigned C-.
 */
export function classifyAbc(
  skus: Array<{ sku: string; despachoValorizado: number }>,
): Map<string, AbcCategory> {
  const result = new Map<string, AbcCategory>();

  const withValue = skus.filter((s) => s.despachoValorizado > 0);
  const withoutValue = skus.filter((s) => s.despachoValorizado <= 0);

  // Sort descending by dispatched value
  const sorted = [...withValue].sort(
    (a, b) => b.despachoValorizado - a.despachoValorizado,
  );

  const total = sorted.reduce((sum, s) => sum + s.despachoValorizado, 0);

  let cumulative = 0;
  for (const s of sorted) {
    cumulative += s.despachoValorizado;
    const p = total > 0 ? cumulative / total : 1;

    let category: AbcCategory;
    if (p <= 0.15) {
      category = 'A+';
    } else if (p <= 0.80) {
      category = 'A';
    } else if (p <= 0.95) {
      category = 'B';
    } else if (p <= 0.98) {
      category = 'C';
    } else {
      category = 'C-';
    }

    result.set(s.sku, category);
  }

  // SKUs with 0 dispatched value → C-
  for (const s of withoutValue) {
    result.set(s.sku, 'C-');
  }

  return result;
}

// ---------------------------------------------------------------------------
// 3. classifyXyz
// ---------------------------------------------------------------------------

/**
 * Classify SKUs into XYZ categories based on rotation coefficient:
 * r = cantDespacho / stockPromedio
 * where stockPromedio = (stockInicio + stockFin) / 2
 * This produces an adimensional coefficient (rotation index).
 * X >= 0.50, X- >= 0.35, Y >= 0.20, Z+ >= 0.10, Z < 0.10.
 * SKUs with 0 stock promedio get Z (no rotation measurable).
 */
export function classifyXyz(
  skus: Array<{ sku: string; cantDespacho: number; stockPromedio: number }>,
): Map<string, XyzCategory> {
  const result = new Map<string, XyzCategory>();

  for (const s of skus) {
    const r = s.stockPromedio > 0 ? s.cantDespacho / s.stockPromedio : 0;

    let category: XyzCategory;
    if (r >= 0.50) {
      category = 'X';
    } else if (r >= 0.35) {
      category = 'X-';
    } else if (r >= 0.20) {
      category = 'Y';
    } else if (r >= 0.10) {
      category = 'Z+';
    } else {
      category = 'Z';
    }

    result.set(s.sku, category);
  }

  return result;
}

// ---------------------------------------------------------------------------
// 4. buildMatrix
// ---------------------------------------------------------------------------

/**
 * Create the 5x5 matrix (25 cells) for ABC x XYZ, aggregating counts and
 * stock values from the classified SKU list.
 */
export function buildMatrix(skus: SkuClassified[]): MatrixCell[] {
  // Initialize all 25 cells
  const cellMap = new Map<string, MatrixCell>();

  for (const abc of ABC_ORDER) {
    for (const xyz of XYZ_ORDER) {
      cellMap.set(`${abc}|${xyz}`, {
        abc,
        xyz,
        count: 0,
        totalStock: 0,
        totalValorizado: 0,
      });
    }
  }

  // Populate from SKUs
  for (const sku of skus) {
    const key = `${sku.abc}|${sku.xyz}`;
    const cell = cellMap.get(key)!;
    cell.count += 1;
    cell.totalStock += sku.stockCant;
    cell.totalValorizado += sku.valorizadoStock;
  }

  // Return all 25 cells in order
  const result: MatrixCell[] = [];
  for (const abc of ABC_ORDER) {
    for (const xyz of XYZ_ORDER) {
      result.push(cellMap.get(`${abc}|${xyz}`)!);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// 5. processAbcXyz — orchestrator
// ---------------------------------------------------------------------------

export function processAbcXyz(params: {
  movimientos: Array<{
    articulo: string;
    descripcion: string;
    cantidadTransaccion: number;
    costoTotalTransaccion: number;
    fecha: string;
    codigoOrganizacion: string;
  }>;
  stockInicioMap: Map<
    string,
    { cantidad: number; valorizado: number; descripcion: string }
  >;
  stockFinMap: Map<
    string,
    { cantidad: number; valorizado: number; descripcion: string }
  >;
  nave?: string;
}): AbcXyzResponse {
  const { movimientos, stockInicioMap, stockFinMap, nave } = params;

  // 1. Filter by nave if provided and not 'todas'
  const filtered =
    nave && nave !== 'todas'
      ? movimientos.filter((m) => m.codigoOrganizacion === nave)
      : movimientos;

  // 2. Count business days from unique dates
  const allDates = filtered.map((m) => m.fecha);
  const businessDays = countBusinessDays(allDates);

  // 3. Aggregate movements by SKU
  const movAgg = new Map<
    string,
    {
      descripcion: string;
      cantDespacho: number;
      despachoValorizado: number;
      fechas: Set<string>;
    }
  >();

  for (const m of filtered) {
    const existing = movAgg.get(m.articulo);
    if (existing) {
      existing.cantDespacho += m.cantidadTransaccion;
      existing.despachoValorizado += m.costoTotalTransaccion;
      existing.fechas.add(m.fecha);
    } else {
      movAgg.set(m.articulo, {
        descripcion: m.descripcion,
        cantDespacho: m.cantidadTransaccion,
        despachoValorizado: m.costoTotalTransaccion,
        fechas: new Set([m.fecha]),
      });
    }
  }

  // 4. Build unified SKU list merging movements + stock inicio + stock fin
  const allSkus = new Set<string>([
    ...movAgg.keys(),
    ...stockInicioMap.keys(),
    ...stockFinMap.keys(),
  ]);
  const skuList: SkuAggregated[] = [];

  for (const sku of allSkus) {
    const mov = movAgg.get(sku);
    const stockInicio = stockInicioMap.get(sku);
    const stockFin = stockFinMap.get(sku);

    const stockInicioCant = stockInicio?.cantidad ?? 0;
    const stockFinCant = stockFin?.cantidad ?? 0;
    const stockPromedio = (stockInicioCant + stockFinCant) / 2;

    // Count distinct business days for this SKU's movement dates
    const diasConMovimiento = mov
      ? countBusinessDays([...mov.fechas])
      : 0;

    skuList.push({
      sku,
      descripcion: mov?.descripcion ?? stockFin?.descripcion ?? stockInicio?.descripcion ?? '',
      stockInicioCant,
      stockCant: stockFinCant,
      stockPromedio,
      valorizadoStock: stockFin?.valorizado ?? 0,
      cantDespacho: mov?.cantDespacho ?? 0,
      despachoValorizado: mov?.despachoValorizado ?? 0,
      diasConMovimiento,
    });
  }

  // 5. Classify
  const abcMap = classifyAbc(skuList);
  const xyzMap = classifyXyz(skuList); // rotation = cantDespacho / stockPromedio

  // 6. Combine into SkuClassified array
  const classifiedSkus: SkuClassified[] = skuList.map((s) => ({
    ...s,
    abc: abcMap.get(s.sku)!,
    xyz: xyzMap.get(s.sku)!,
  }));

  // 7. Build matrix
  const matriz = buildMatrix(classifiedSkus);

  // 8. Compute KPIs
  const valorStockTotal = classifiedSkus.reduce(
    (sum, s) => sum + s.valorizadoStock,
    0,
  );
  const cantStockTotal = classifiedSkus.reduce(
    (sum, s) => sum + s.stockCant,
    0,
  );

  // 9. Return response
  return {
    kpis: {
      valorStockTotal,
      cantStockTotal,
      skuCount: classifiedSkus.length,
      businessDays,
    },
    matriz,
    skus: classifiedSkus,
  };
}
