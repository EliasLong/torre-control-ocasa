'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { DateRange, FacturacionDetalle, CostosDetalle } from '@/types';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/lib/calculations';
import { KPICard } from '@/components/kpi/KPICard';
import { CostosBreakdown } from '@/components/kpi/CostosBreakdown';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { FinancialBreakdownTable } from '@/components/tables/FinancialBreakdownTable';
import { BreakEvenChart } from '@/components/charts/BreakEvenChart';

interface DesgloseRow {
  servicio: string;
  volumen: number;
  tarifa: number;
  subtotal: number;
}

interface DailyDataPoint {
  fecha: string;
  facturacion: FacturacionDetalle;
  costos: CostosDetalle;
  resultado: number;
  margen: number;
}

interface FinancieroResponse {
  kpis: {
    facturacion: number;
    costos: number;
    resultado: number;
    margen: number;
  };
  costosDetalle: {
    fijos: number;
    variables: number;
  };
  monthlyBase: {
    guardaMensual: number;
    fijosMensuales: number;
  };
  desglose: DesgloseRow[];
  dailyData: DailyDataPoint[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

/** Rango por defecto: desde el 1° del mes actual hasta hoy (zona local). */
function defaultMonthRange(): DateRange {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${day}`,
  };
}

export default function FinancieroPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultMonthRange);

  const { data, error, isLoading } = useSWR<FinancieroResponse>(
    `/api/financiero?from=${dateRange.from}&to=${dateRange.to}`,
    fetcher
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">
        Error al cargar datos financieros.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)]">
        Cargando datos financieros...
      </div>
    );
  }

  const margenTrend = data.kpis.margen >= 0 ? 'up' : 'down';
  const resultadoTrend = data.kpis.resultado >= 0 ? 'up' : 'down';

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header + Filter */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Dashboard Financiero
        </h1>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Facturación Total"
          value={formatCompactCurrency(data.kpis.facturacion)}
          trend="up"
          trendValue={formatCurrency(data.kpis.facturacion)}
        />
        <KPICard
          label="Costos Totales"
          value={formatCompactCurrency(data.kpis.costos)}
          trend="neutral"
          trendValue={formatCurrency(data.kpis.costos)}
        />
        <KPICard
          label="Resultado"
          value={formatCompactCurrency(data.kpis.resultado)}
          trend={resultadoTrend}
          trendValue={formatCurrency(data.kpis.resultado)}
        />
        <KPICard
          label="Margen"
          value={formatPercent(data.kpis.margen)}
          trend={margenTrend}
          trendValue={data.kpis.margen >= 0 ? 'positivo' : 'negativo'}
        />
      </div>

      {/* Desglose de Facturación + Costos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
            Desglose de Facturación
          </h2>
          <FinancialBreakdownTable rows={data.desglose} />
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
            Desglose de Costos
          </h2>
          <CostosBreakdown
            fijos={data.costosDetalle.fijos}
            variables={data.costosDetalle.variables}
          />
        </div>
      </div>

      {/* Break-Even Chart - full width */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
          Evolución Acumulada — Break Even
        </h2>
        <BreakEvenChart data={data.dailyData} monthlyBase={data.monthlyBase} />
      </div>
    </div>
  );
}
