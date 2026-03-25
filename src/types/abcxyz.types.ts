export type AbcCategory = 'A+' | 'A' | 'B' | 'C' | 'C-';
export type XyzCategory = 'X' | 'X-' | 'Y' | 'Z+' | 'Z';

export const ABC_ORDER: AbcCategory[] = ['A+', 'A', 'B', 'C', 'C-'];
export const XYZ_ORDER: XyzCategory[] = ['X', 'X-', 'Y', 'Z+', 'Z'];

export interface RawMovimiento {
  fecha: string;
  codigoOrganizacion: string;
  articulo: string;
  descripcion: string;
  cantidadTransaccion: number;
  costoTotalTransaccion: number;
  tipoTransaccion: string;
}

export interface RawMapaRow {
  codigo: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  total: number;
  subinventario: string;
  localizador: string;
}

export interface SkuAggregated {
  sku: string;
  descripcion: string;
  stockInicioCant: number;
  stockCant: number;
  stockPromedio: number;
  valorizadoStock: number;
  cantDespacho: number;
  despachoValorizado: number;
  diasConMovimiento: number;
}

export interface SkuClassified extends SkuAggregated {
  abc: AbcCategory;
  xyz: XyzCategory;
}

export interface MatrixCell {
  abc: AbcCategory;
  xyz: XyzCategory;
  count: number;
  totalStock: number;
  totalValorizado: number;
}

export interface AbcXyzResponse {
  kpis: {
    valorStockTotal: number;
    cantStockTotal: number;
    skuCount: number;
    businessDays: number;
  };
  matriz: MatrixCell[];
  skus: SkuClassified[];
}
