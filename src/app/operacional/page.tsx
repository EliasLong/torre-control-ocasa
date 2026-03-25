'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { KPICard } from '@/components/kpi/KPICard';
import { OperacionalChart } from '@/components/charts/OperacionalChart';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import type { DateRange, PalletOut, OperacionDiaria, OperacionalDashboardData } from '@/types';

// --- Data aggregation helpers ---

function aggregateTotals(palletsOut: PalletOut[]) {
  let total = 0;
  let b2c = 0;
  let b2b = 0;

  for (const p of palletsOut) {
    total += p.pallets;
    if (p.tipo === 'B2C') b2c += p.pallets;
    else b2b += p.pallets;
  }

  return { total, b2c, b2b };
}

function sumField(items: OperacionDiaria[], field: keyof Omit<OperacionDiaria, 'fecha'>): number {
  return items.reduce((acc, item) => acc + item[field], 0);
}

function mergeByDate(palletsOut: PalletOut[], operaciones: OperacionDiaria[]) {
  const dateMap = new Map<string, { fecha: string; palletsOut: number; picking: number; palletsIn: number; contenedores: number }>();

  for (const op of operaciones) {
    dateMap.set(op.fecha, {
      fecha: op.fecha,
      palletsOut: 0,
      picking: op.picking,
      palletsIn: op.pallets_in,
      contenedores: op.contenedores,
    });
  }

  for (const p of palletsOut) {
    const entry = dateMap.get(p.fecha);
    if (!entry) continue;
    entry.palletsOut += p.pallets;
  }

  return Array.from(dateMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

// --- SWR fetcher ---

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error fetching data');
  return res.json() as Promise<OperacionalDashboardData>;
});

const DEFAULT_RANGE: DateRange = { from: '2026-03-01', to: '2026-03-30' };
const DEFAULT_CAPACIDAD = 2800;
const DEFAULT_OBJETIVOS = { contenedores: 150, pallets_in: 6800, picking: 43530, pallets_out: 8944 };

export default function OperacionalPage() {
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_RANGE);
  const [capacidadPicking, setCapacidadPicking] = useState(DEFAULT_CAPACIDAD);

  const apiUrl = `/api/operacional?from=${dateRange.from}&to=${dateRange.to}`;
  const { data, error, isLoading } = useSWR(apiUrl, fetcher, { keepPreviousData: true });

  const palletsOut = data?.palletsOut ?? [];
  const operaciones = data?.operaciones ?? [];
  const objetivos = data?.objetivos ?? DEFAULT_OBJETIVOS;

  const totals = useMemo(() => aggregateTotals(palletsOut), [palletsOut]);
  const totalPicking = useMemo(() => sumField(operaciones, 'picking'), [operaciones]);
  const totalPalletsIn = useMemo(() => sumField(operaciones, 'pallets_in'), [operaciones]);
  const totalContenedores = useMemo(() => sumField(operaciones, 'contenedores'), [operaciones]);
  const chartData = useMemo(() => mergeByDate(palletsOut, operaciones), [palletsOut, operaciones]);

  // KPI trend: green if >= objective, red if below
  const pickingPct = objetivos.picking > 0 ? Math.round((totalPicking / objetivos.picking) * 100) : 0;
  const palletsOutPct = objetivos.pallets_out > 0 ? Math.round((totals.total / objetivos.pallets_out) * 100) : 0;
  const palletsInPct = objetivos.pallets_in > 0 ? Math.round((totalPalletsIn / objetivos.pallets_in) * 100) : 0;
  const contenedoresPct = objetivos.contenedores > 0 ? Math.round((totalContenedores / objetivos.contenedores) * 100) : 0;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">
        Error al cargar datos operacionales. Intente nuevamente.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard Operacional</h1>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Total Pallets Out"
          value={isLoading ? '...' : totals.total.toLocaleString()}
          trendValue={`${palletsOutPct}% del obj. (${objetivos.pallets_out.toLocaleString()}) — B2C: ${totals.b2c.toLocaleString()} / B2B: ${totals.b2b.toLocaleString()}`}
          trend={palletsOutPct >= 100 ? 'up' : 'down'}
        />
        <KPICard
          label="Total Picking"
          value={isLoading ? '...' : totalPicking.toLocaleString()}
          trendValue={`${pickingPct}% del objetivo (${objetivos.picking.toLocaleString()})`}
          trend={pickingPct >= 100 ? 'up' : 'down'}
        />
        <KPICard
          label="Total Pallets In"
          value={isLoading ? '...' : totalPalletsIn.toLocaleString()}
          trendValue={`${palletsInPct}% del objetivo (${objetivos.pallets_in.toLocaleString()})`}
          trend={palletsInPct >= 100 ? 'up' : 'down'}
        />
        <KPICard
          label="Total Contenedores"
          value={isLoading ? '...' : totalContenedores.toLocaleString()}
          trendValue={`${contenedoresPct}% del objetivo (${objetivos.contenedores.toLocaleString()})`}
          trend={contenedoresPct >= 100 ? 'up' : 'down'}
        />
      </div>

      {/* Chart */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Evolutivo Diario</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--color-text-muted)]">Capacidad Picking:</label>
            <input
              type="number"
              value={capacidadPicking}
              onChange={e => setCapacidadPicking(Number(e.target.value) || 0)}
              className="w-24 bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-2 py-1 text-sm text-right"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="h-[420px] animate-pulse bg-[var(--color-border)] rounded-lg opacity-20" />
        ) : (
          <OperacionalChart
            data={chartData}
            capacidadPicking={capacidadPicking}
          />
        )}
      </div>
    </div>
  );
}
