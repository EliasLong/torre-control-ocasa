'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { KPICard } from '@/components/kpi/KPICard';
import { AbcXyzMatrix } from '@/components/tables/AbcXyzMatrix';
import { SkuTable } from '@/components/tables/SkuTable';
import { NaveFilter } from '@/components/filters/NaveFilter';
import { formatCurrency } from '@/lib/calculations';
import type { AbcCategory, XyzCategory, AbcXyzResponse } from '@/types/abcxyz.types';
import type { Nave } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function AbcXyzDashboard() {
  const [nave, setNave] = useState<Nave>('todas');
  const [selectedCell, setSelectedCell] = useState<{ abc: AbcCategory; xyz: XyzCategory } | null>(null);

  const { data, error, isLoading } = useSWR<AbcXyzResponse>(
    `/api/abc-xyz?nave=${nave}`,
    fetcher,
  );

  const handleCellClick = (abc: AbcCategory, xyz: XyzCategory) => {
    if (selectedCell?.abc === abc && selectedCell?.xyz === xyz) {
      setSelectedCell(null);
    } else {
      setSelectedCell({ abc, xyz });
    }
  };

  const kpis = useMemo(() => {
    if (!data) return null;
    if (!selectedCell) return data.kpis;

    const filtered = data.skus.filter(
      (s) => s.abc === selectedCell.abc && s.xyz === selectedCell.xyz,
    );

    return {
      valorStockTotal: filtered.reduce((sum, s) => sum + s.valorizadoStock, 0),
      cantStockTotal: filtered.reduce((sum, s) => sum + s.stockCant, 0),
      skuCount: filtered.length,
      businessDays: data.kpis.businessDays,
    };
  }, [data, selectedCell]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-accent-cyan)] border-t-transparent" />
      </div>
    );
  }

  if (error || !data || !kpis) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">
        Error cargando datos ABC-XYZ
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matriz ABC-XYZ</h1>
        <NaveFilter value={nave} onChange={(v) => { setNave(v); setSelectedCell(null); }} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label={selectedCell ? `Val. Stock (${selectedCell.abc}/${selectedCell.xyz})` : 'Valor Stock Total'}
          value={formatCurrency(kpis.valorStockTotal)}
        />
        <KPICard
          label={selectedCell ? `Cant. Stock (${selectedCell.abc}/${selectedCell.xyz})` : 'Cant. Stock Total'}
          value={kpis.cantStockTotal.toLocaleString('es-AR')}
          unit="unidades"
        />
        <KPICard
          label={selectedCell ? `SKUs (${selectedCell.abc}/${selectedCell.xyz})` : 'SKUs Únicos'}
          value={kpis.skuCount.toLocaleString('es-AR')}
        />
        <KPICard label="Días Hábiles" value={kpis.businessDays} unit="días" />
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Matriz Cruzada</h2>
          {selectedCell && (
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/20 transition-colors"
            >
              Limpiar filtro ({selectedCell.abc} / {selectedCell.xyz})
            </button>
          )}
        </div>
        <AbcXyzMatrix
          data={data.matriz}
          selectedCell={selectedCell}
          onCellClick={handleCellClick}
        />
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Listado de SKUs</h2>
        <SkuTable skus={data.skus} filter={selectedCell} />
      </div>
    </div>
  );
}
