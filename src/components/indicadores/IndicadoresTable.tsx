'use client';

import { useState, useMemo } from 'react';
import { Search, X, DatabaseZap } from 'lucide-react';

interface IndicadoresTableProps {
  data: Record<string, string | number>[];
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  searchKeys?: string[];
  maxHeight?: string;
  emptyMessage?: string;
}

export function IndicadoresTable({
  data,
  columns,
  searchKeys,
  maxHeight = '400px',
  emptyMessage = 'No se encontraron registros para los filtros seleccionados.',
}: IndicadoresTableProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search || !searchKeys?.length) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? '').toLowerCase().includes(lower),
      ),
    );
  }, [data, search, searchKeys]);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <DatabaseZap size={28} className="text-[var(--color-text-muted)] opacity-40" />
        <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          Intenta seleccionar otra fecha o verificar la fuente de datos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {searchKeys && searchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Filtrar registros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-cyan)] focus:border-[var(--color-accent-cyan)] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Limpiar busqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}
      <div className="overflow-auto rounded-lg border border-[var(--color-border)]" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--color-bg-primary)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 font-semibold text-xs uppercase tracking-wider text-[var(--color-accent-cyan)] border-b-2 border-[var(--color-accent-cyan)]/20 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                  No hay resultados para &quot;{search}&quot;
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-accent-cyan)]/5 transition-colors ${
                    i % 2 === 0 ? 'bg-transparent' : 'bg-[var(--color-bg-primary)]/40'
                  }`}
                >
                  {columns.map((col) => {
                    const val = row[col.key];
                    const display = typeof val === 'number' ? val.toLocaleString() : (val ?? '');
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 text-[var(--color-text-primary)] whitespace-nowrap ${
                          col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                        }`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          {filtered.length === data.length
            ? `${data.length} registros`
            : `${filtered.length} de ${data.length} registros`}
        </span>
        {search && filtered.length < data.length && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-[var(--color-accent-cyan)] hover:underline"
          >
            Mostrar todos
          </button>
        )}
      </div>
    </div>
  );
}
