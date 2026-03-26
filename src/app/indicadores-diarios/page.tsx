'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { KPICard } from '@/components/kpi/KPICard';
import { SubTabs } from '@/components/indicadores/SubTabs';
import { PickingTab } from '@/components/indicadores/PickingTab';
import { RecepcionTab } from '@/components/indicadores/RecepcionTab';
import { MovimientosTab } from '@/components/indicadores/MovimientosTab';
import { PortonesTab } from '@/components/indicadores/PortonesTab';
import { ResumenTab } from '@/components/indicadores/ResumenTab';
import type { IndicadoresDiariosData, IndicadorDiario, MovimientoRaw } from '@/types';

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

/** Fecha local YYYY-MM-DD (sin UTC para evitar desfase de zona horaria) */
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFechaDisplay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function findByOrg(resumen: IndicadorDiario[], org: string): IndicadorDiario | undefined {
  return resumen.find(r => r.org === org);
}

type OrgFilter = 'ALL' | 'PL2' | 'PL3';
type TurnoFilter = 'ALL' | 'MAÑANA' | 'TARDE';

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
        active
          ? 'bg-[var(--color-accent-cyan)] text-white'
          : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {label}
    </button>
  );
}

export default function IndicadoresDiariosPage() {
  const fecha = todayStr();
  const [activeTab, setActiveTab] = useState('picking');
  const [orgFilter, setOrgFilter] = useState<OrgFilter>('ALL');
  const [turnoFilter, setTurnoFilter] = useState<TurnoFilter>('ALL');

  const { data, error, isLoading } = useSWR(
    `/api/indicadores-diarios?fecha=${fecha}`,
    fetcher,
    { keepPreviousData: true }
  );

  const resumen = data?.resumen ?? [];
  const allMovimientos = data?.movimientos ?? [];
  const turno = data?.turno ?? [];
  const historico = data?.historico ?? [];

  // Apply global filters to movimientos
  const movimientos = useMemo(() => {
    let filtered = allMovimientos;
    if (orgFilter !== 'ALL') {
      filtered = filtered.filter(m => m.org === orgFilter);
    }
    if (turnoFilter !== 'ALL') {
      filtered = filtered.filter(m => m.turno === turnoFilter);
    }
    return filtered;
  }, [allMovimientos, orgFilter, turnoFilter]);

  // Recalculate turno breakdown based on filtered movimientos
  const filteredTurno = useMemo(() => {
    if (turnoFilter === 'ALL' && orgFilter === 'ALL') return turno;
    const turnoMap = new Map<string, { picking: number; recepcion: number }>();
    for (const mov of movimientos) {
      const t = mov.turno;
      const tipo = mov.tipoTransaccion.toLowerCase();
      const isPick = tipo === 'sales order pick' && mov.subTransferencia === 'PORTONES';
      const isRec = mov.subinventario === 'RECEPCION';
      if (!isPick && !isRec) continue;
      let entry = turnoMap.get(t);
      if (!entry) { entry = { picking: 0, recepcion: 0 }; turnoMap.set(t, entry); }
      const qty = Math.abs(mov.cantidad);
      if (isPick) entry.picking += qty;
      if (isRec) entry.recepcion += qty;
    }
    return Array.from(turnoMap.entries()).map(([t, d]) => ({ turno: t, picking: d.picking, recepcion: d.recepcion }));
  }, [movimientos, turno, turnoFilter, orgFilter]);

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
      {/* Header + Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Indicadores Diarios</h1>
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {formatFechaDisplay(fecha)}
          </span>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Planta:</span>
            <FilterButton label="Todas" active={orgFilter === 'ALL'} onClick={() => setOrgFilter('ALL')} />
            <FilterButton label="PL2" active={orgFilter === 'PL2'} onClick={() => setOrgFilter('PL2')} />
            <FilterButton label="PL3" active={orgFilter === 'PL3'} onClick={() => setOrgFilter('PL3')} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">Turno:</span>
            <FilterButton label="Todos" active={turnoFilter === 'ALL'} onClick={() => setTurnoFilter('ALL')} />
            <FilterButton label="Mañana" active={turnoFilter === 'MAÑANA'} onClick={() => setTurnoFilter('MAÑANA')} />
            <FilterButton label="Tarde" active={turnoFilter === 'TARDE'} onClick={() => setTurnoFilter('TARDE')} />
          </div>
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
          label="Recepción"
          value={isLoading ? '...' : (total?.recepcion ?? 0).toLocaleString()}
          trendValue={`PL2: ${(pl2?.recepcion ?? 0).toLocaleString()} / PL3: ${(pl3?.recepcion ?? 0).toLocaleString()}`}
          trend="neutral"
        />
        <KPICard
          label="Contenedores"
          value={isLoading ? '...' : (total?.contenedores ?? 0).toLocaleString()}
          trendValue={`PL2: ${(pl2?.contenedores ?? 0).toLocaleString()} / PL3: ${(pl3?.contenedores ?? 0).toLocaleString()}`}
          trend="neutral"
        />
        <KPICard
          label="Movimientos"
          value={isLoading ? '...' : (total?.movimientos ?? 0).toLocaleString()}
          trendValue={`PL2: ${(pl2?.movimientos ?? 0).toLocaleString()} / PL3: ${(pl3?.movimientos ?? 0).toLocaleString()}`}
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
            {activeTab === 'picking' && <PickingTab movimientos={movimientos} turno={filteredTurno} />}
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
