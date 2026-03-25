'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface IndicadoresTableProps {
  data: Record<string, string | number>[];
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  searchKeys?: string[];
  maxHeight?: string;
}

export function IndicadoresTable({
  data,
  columns,
  searchKeys,
  maxHeight = '400px',
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
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
        Sin datos para esta fecha
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {searchKeys && searchKeys.length > 0 && (
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
          />
        </div>
      )}
      <div className="overflow-auto rounded-lg border border-[var(--color-border)]" style={{ maxHeight }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--color-bg-card)] z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2 font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)] ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-surface)]/50 transition-colors"
              >
                {columns.map((col) => {
                  const val = row[col.key];
                  const display = typeof val === 'number' ? val.toLocaleString() : (val ?? '');
                  return (
                    <td
                      key={col.key}
                      className={`px-3 py-2 text-[var(--color-text-primary)] ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="text-xs text-[var(--color-text-muted)]">
        {filtered.length} de {data.length} registros
      </span>
    </div>
  );
}
