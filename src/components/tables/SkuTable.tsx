'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/calculations';
import type { AbcCategory, XyzCategory, SkuClassified } from '@/types/abcxyz.types';

interface Props {
  skus: SkuClassified[];
  filter?: { abc: AbcCategory; xyz: XyzCategory } | null;
}

type SortKey = keyof Pick<
  SkuClassified,
  'sku' | 'descripcion' | 'stockCant' | 'valorizadoStock' | 'cantDespacho' | 'despachoValorizado' | 'diasConMovimiento' | 'abc' | 'xyz'
>;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 50;

const ABC_COLORS: Record<AbcCategory, string> = {
  'A+': 'bg-[var(--color-accent-cyan)]/20 text-[var(--color-accent-cyan)]',
  A: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]',
  B: 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]',
  C: 'bg-orange-500/20 text-orange-400',
  'C-': 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]',
};

const XYZ_COLORS: Record<XyzCategory, string> = {
  X: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]',
  'X-': 'bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)]/70',
  Y: 'bg-[var(--color-accent-amber)]/20 text-[var(--color-accent-amber)]',
  'Z+': 'bg-[var(--color-accent-amber)]/10 text-[var(--color-accent-amber)]/70',
  Z: 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]',
};

const COLUMNS: { key: SortKey; label: string; align?: 'right' | 'center' }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'stockCant', label: 'Stock Cant', align: 'right' },
  { key: 'valorizadoStock', label: 'Val. Stock', align: 'right' },
  { key: 'cantDespacho', label: 'Cant Despacho', align: 'right' },
  { key: 'despachoValorizado', label: 'Desp. Valorizado', align: 'right' },
  { key: 'diasConMovimiento', label: 'Días Mov.', align: 'right' },
  { key: 'abc', label: 'ABC', align: 'center' },
  { key: 'xyz', label: 'XYZ', align: 'center' },
];

export function SkuTable({ skus, filter }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('despachoValorizado');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    setPage(0);
    if (!filter) return skus;
    return skus.filter((s) => s.abc === filter.abc && s.xyz === filter.xyz);
  }, [skus, filter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  const summaryStock = filtered.reduce((sum, s) => sum + s.valorizadoStock, 0);
  const summaryDespacho = filtered.reduce((sum, s) => sum + s.despachoValorizado, 0);

  return (
    <div>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">
        Mostrando {filtered.length} de {skus.length} SKUs | Stock:{' '}
        {formatCurrency(summaryStock)} | Despacho: {formatCurrency(summaryDespacho)}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`py-2 px-2 whitespace-nowrap cursor-pointer select-none hover:text-[var(--color-text-primary)] transition-colors ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((s) => (
              <tr
                key={s.sku}
                className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg-surface)] transition-colors"
              >
                <td className="py-2 px-2 font-mono text-[var(--color-accent-cyan)]">{s.sku}</td>
                <td className="py-2 px-2 text-[var(--color-text-muted)] max-w-xs truncate">
                  {s.descripcion}
                </td>
                <td className="py-2 px-2 text-right">
                  {s.stockCant.toLocaleString('es-AR')}
                </td>
                <td className="py-2 px-2 text-right">{formatCurrency(s.valorizadoStock)}</td>
                <td className="py-2 px-2 text-right">
                  {s.cantDespacho.toLocaleString('es-AR')}
                </td>
                <td className="py-2 px-2 text-right">
                  {formatCurrency(s.despachoValorizado)}
                </td>
                <td className="py-2 px-2 text-right">
                  {s.diasConMovimiento.toLocaleString('es-AR')}
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${ABC_COLORS[s.abc]}`}
                  >
                    {s.abc}
                  </span>
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${XYZ_COLORS[s.xyz]}`}
                  >
                    {s.xyz}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[var(--color-text-muted)]">
            Pág. {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-xs rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-bg-card)] transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-xs rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-bg-card)] transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
