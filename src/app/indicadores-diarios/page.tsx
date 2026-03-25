'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { KPICard } from '@/components/kpi/KPICard';
import { SubTabs } from '@/components/indicadores/SubTabs';
import { PickingTab } from '@/components/indicadores/PickingTab';
import { RecepcionTab } from '@/components/indicadores/RecepcionTab';
import { MovimientosTab } from '@/components/indicadores/MovimientosTab';
import { PortonesTab } from '@/components/indicadores/PortonesTab';
import { ResumenTab } from '@/components/indicadores/ResumenTab';
import type { IndicadoresDiariosData, IndicadorDiario } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error fetching data');
  return res.json() as Promise<IndicadoresDiariosData>;
});

const SUB_TABS = [
  { id: 'picking', label: 'Picking' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'portones', label: 'Portones' },
  { id: 'resumen', label: 'Resumen' },
];

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function formatFechaDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function findByOrg(resumen: IndicadorDiario[], org: string): IndicadorDiario | undefined {
  return resumen.find(r => r.org === org);
}

export default function IndicadoresDiariosPage() {
  const [fecha, setFecha] = useState(todayStr);
  const [activeTab, setActiveTab] = useState('picking');

  const { data, error, isLoading } = useSWR(
    `/api/indicadores-diarios?fecha=${fecha}`,
    fetcher,
    { keepPreviousData: true }
  );

  function cambiarFecha(dias: number) {
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    setFecha(d.toISOString().split('T')[0]);
  }

  const resumen = data?.resumen ?? [];
  const movimientos = data?.movimientos ?? [];
  const turno = data?.turno ?? [];
  const historico = data?.historico ?? [];

  const total = useMemo(() => findByOrg(resumen, 'Total'), [resumen]);
  const pl2 = useMemo(() => findByOrg(resumen, 'PL2'), [resumen]);
  const pl3 = useMemo(() => findByOrg(resumen, 'PL3'), [resumen]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">
        Error al cargar indicadores diarios. Intente nuevamente.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header + Date Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Indicadores Diarios</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Día anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium text-[var(--color-text-primary)] min-w-[100px] text-center">
            {formatFechaDisplay(fecha)}
          </span>
          <button
            onClick={() => cambiarFecha(1)}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Día siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Picking"
          value={isLoading ? '...' : (total?.picking ?? 0).toLocaleString()}
          trendValue={`PL2: ${(pl2?.picking ?? 0).toLocaleString()} / PL3: ${(pl3?.picking ?? 0).toLocaleString()}`}
          trend="neutral"
        />
        <KPICard
          label="Pallet In"
          value={isLoading ? '...' : (total?.pallet_in ?? 0).toLocaleString()}
          trendValue={`PL2: ${(pl2?.pallet_in ?? 0).toLocaleString()} / PL3: ${(pl3?.pallet_in ?? 0).toLocaleString()}`}
          trend="neutral"
        />
        <KPICard
          label="Pallet Out"
          value={isLoading ? '...' : (total?.pallet_out ?? 0).toLocaleString()}
          trendValue={`PL2: ${(pl2?.pallet_out ?? 0).toLocaleString()} / PL3: ${(pl3?.pallet_out ?? 0).toLocaleString()}`}
          trend="neutral"
        />
        <KPICard
          label="Contenedores"
          value={isLoading ? '...' : (total?.contenedores ?? 0).toLocaleString()}
          trend="neutral"
        />
      </div>

      {/* Sub-tabs */}
      <SubTabs tabs={SUB_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div>
        {isLoading ? (
          <div className="h-[400px] animate-pulse bg-[var(--color-border)] rounded-lg opacity-20" />
        ) : (
          <>
            {activeTab === 'picking' && <PickingTab movimientos={movimientos} turno={turno} />}
            {activeTab === 'recepcion' && <RecepcionTab movimientos={movimientos} />}
            {activeTab === 'movimientos' && <MovimientosTab movimientos={movimientos} />}
            {activeTab === 'portones' && <PortonesTab movimientos={movimientos} />}
            {activeTab === 'resumen' && <ResumenTab historico={historico} />}
          </>
        )}
      </div>
    </div>
  );
}
