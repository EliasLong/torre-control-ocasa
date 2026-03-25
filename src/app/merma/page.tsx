'use client';

import useSWR from 'swr';
import { KPICard } from '@/components/kpi/KPICard';
import { MermaChart } from '@/components/charts/MermaChart';
import { formatCurrency } from '@/lib/calculations';

interface MermaData {
  kpis: {
    analisis: number;
    calidad: number;
    despachos: number;
    mermaPorc: number;
    objetivo: number;
  };
  evolutivo: { mes: string; mermaPorc: number }[];
  porCategoria: { categoria: string; monto: number }[];
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error fetching data');
  return res.json() as Promise<MermaData>;
});

export default function MermaPage() {
  const { data, error, isLoading } = useSWR('/api/merma', fetcher);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">
        Error al cargar datos de merma. Intente nuevamente.
      </div>
    );
  }

  const loading = isLoading || !data;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Merma</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Cat. Principal" value={loading ? '...' : formatCurrency(data.kpis.analisis)} />
        <KPICard label="Cat. Secundaria" value={loading ? '...' : formatCurrency(data.kpis.calidad)} />
        <KPICard label="Total Despachos" value={loading ? '...' : formatCurrency(data.kpis.despachos)} />
        <KPICard
          label="Merma %"
          value={loading ? '...' : data.kpis.mermaPorc.toFixed(6)}
          unit="%"
          trend={data && data.kpis.mermaPorc < data.kpis.objetivo ? 'up' : 'down'}
          trendValue={data ? `Obj < ${data.kpis.objetivo}%` : ''}
        />
      </div>
      {!loading && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <MermaChart evolutivo={data.evolutivo} porCategoria={data.porCategoria} objetivo={data.kpis.objetivo} />
        </div>
      )}
    </div>
  );
}
