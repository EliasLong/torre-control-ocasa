'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { X, Filter, Calendar } from 'lucide-react';
import { KPICard, KPICardSkeleton } from '@/components/kpi/KPICard';
import { SubTabs } from '@/components/indicadores/SubTabs';
import { PickingTab } from '@/components/indicadores/PickingTab';
import { RecepcionTab } from '@/components/indicadores/RecepcionTab';
import { MovimientosTab } from '@/components/indicadores/MovimientosTab';
import { RmaTab } from '@/components/indicadores/RmaTab';
import { CamionesTab } from '@/components/indicadores/CamionesTab';
import { OcupacionTab } from '@/components/indicadores/OcupacionTab';
import type { IndicadoresDiariosData, IndicadorDiario } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error fetching data');
  return res.json() as Promise<IndicadoresDiariosData>;
});

const SUB_TABS = [
  { id: 'picking', label: 'Picking' },
  { id: 'recepcion', label: 'Recepcion' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'rma', label: 'RMA' },
  { id: 'ocupacion', label: 'Ocupacion' },
  { id: 'camiones', label: 'Mov. Camiones' },
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

/* ---------- Filter Chip ---------- */
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200
        ${active
          ? 'bg-[var(--color-accent-cyan)] text-white shadow-sm shadow-[var(--color-accent-cyan)]/25'
          : 'bg-transparent text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
        }
      `}
    >
      {label}
    </button>
  );
}

/* ---------- Empty State ---------- */
function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-[var(--color-border)]/30 flex items-center justify-center">
        <Filter size={24} className="text-[var(--color-text-muted)]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
          Sin resultados para los filtros seleccionados
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Intenta modificar los filtros de planta o turno
        </p>
      </div>
      <button
        onClick={onClear}
        className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent-cyan)] transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

/* ---------- Loading skeleton for content ---------- */
function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 rounded-lg bg-[var(--color-border)]/30 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-[300px] rounded-lg bg-[var(--color-border)]/20 animate-pulse" />
        <div className="h-[300px] rounded-lg bg-[var(--color-border)]/20 animate-pulse" />
      </div>
    </div>
  );
}

/* ========== Main Page ========== */
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

  const hasActiveFilters = orgFilter !== 'ALL' || turnoFilter !== 'ALL';

  function clearFilters() {
    setOrgFilter('ALL');
    setTurnoFilter('ALL');
  }

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

  // Recalculate turno breakdown based on filtered movimientos (only picking)
  const filteredTurno = useMemo(() => {
    if (turnoFilter === 'ALL' && orgFilter === 'ALL') return turno;
    const turnoMap = new Map<string, number>();
    for (const mov of movimientos) {
      const tipo = mov.tipoTransaccion.toLowerCase();
      if (tipo === 'sales order pick' && mov.subTransferencia === 'PORTONES') {
        turnoMap.set(mov.turno, (turnoMap.get(mov.turno) ?? 0) + Math.abs(mov.cantidad));
      }
    }
    return Array.from(turnoMap.entries()).map(([t, picking]) => ({ turno: t, picking }));
  }, [movimientos, turno, turnoFilter, orgFilter]);

  const total = useMemo(() => findByOrg(resumen, 'Total'), [resumen]);
  const pl2 = useMemo(() => findByOrg(resumen, 'PL2'), [resumen]);
  const pl3 = useMemo(() => findByOrg(resumen, 'PL3'), [resumen]);

  // Compute KPI values based on active filters
  const kpiSource = useMemo(() => {
    if (orgFilter === 'PL2') return { main: pl2, label: 'PL2' };
    if (orgFilter === 'PL3') return { main: pl3, label: 'PL3' };
    return { main: total, label: undefined };
  }, [orgFilter, total, pl2, pl3]);

  const kpiSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (orgFilter !== 'ALL') parts.push(orgFilter);
    if (turnoFilter !== 'ALL') parts.push(turnoFilter === 'MAÑANA' ? 'Manana' : 'Tarde');
    return parts.length > 0 ? parts.join(' / ') : undefined;
  }, [orgFilter, turnoFilter]);

  const buildTrendValue = (field: 'picking' | 'recepcion' | 'contenedores') => {
    if (orgFilter !== 'ALL') return undefined;
    return `PL2: ${(pl2?.[field] ?? 0).toLocaleString()} / PL3: ${(pl3?.[field] ?? 0).toLocaleString()}`;
  };

  /* Error state */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--color-accent-red)]/10 flex items-center justify-center">
          <X size={20} className="text-[var(--color-accent-red)]" />
        </div>
        <p className="text-sm font-medium text-[var(--color-accent-red)]">
          Error al cargar indicadores diarios
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">Intente nuevamente mas tarde</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* ---- Section 1: Page Header ---- */}
      <header className="flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Indicadores Diarios
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              Resumen operativo del dia en curso
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Calendar size={14} />
            <time dateTime={fecha} className="font-medium tabular-nums">
              {formatFechaDisplay(fecha)}
            </time>
          </div>
        </div>
      </header>

      {/* ---- Section 2: Filter Bar ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Filter size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
        </div>

        <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />

        {/* Planta group */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Planta:</span>
          <div className="flex gap-1.5">
            <FilterChip label="Todas" active={orgFilter === 'ALL'} onClick={() => setOrgFilter('ALL')} />
            <FilterChip label="PL2" active={orgFilter === 'PL2'} onClick={() => setOrgFilter('PL2')} />
            <FilterChip label="PL3" active={orgFilter === 'PL3'} onClick={() => setOrgFilter('PL3')} />
          </div>
        </div>

        <div className="h-4 w-px bg-[var(--color-border)] hidden sm:block" />

        {/* Turno group */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Turno:</span>
          <div className="flex gap-1.5">
            <FilterChip label="Todos" active={turnoFilter === 'ALL'} onClick={() => setTurnoFilter('ALL')} />
            <FilterChip label="Manana" active={turnoFilter === 'MAÑANA'} onClick={() => setTurnoFilter('MAÑANA')} />
            <FilterChip label="Tarde" active={turnoFilter === 'TARDE'} onClick={() => setTurnoFilter('TARDE')} />
          </div>
        </div>

        {/* Clear button (only visible when filters active) */}
        {hasActiveFilters && (
          <>
            <div className="flex-1" />
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full text-[var(--color-accent-red)] border border-[var(--color-accent-red)]/30 hover:bg-[var(--color-accent-red)]/10 transition-colors"
            >
              <X size={12} />
              Limpiar
            </button>
          </>
        )}
      </div>

      {/* ---- Section 3: KPI Cards ---- */}
      <section>
        {hasActiveFilters && (
          <p className="text-xs text-[var(--color-text-muted)] mb-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)]" />
            Mostrando datos filtrados
            {orgFilter !== 'ALL' && <span className="font-semibold text-[var(--color-text-primary)]">{orgFilter}</span>}
            {turnoFilter !== 'ALL' && <span className="font-semibold text-[var(--color-text-primary)]">{turnoFilter === 'MAÑANA' ? 'Turno Manana' : 'Turno Tarde'}</span>}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                label="Picking"
                value={(kpiSource.main?.picking ?? 0).toLocaleString()}
                trendValue={buildTrendValue('picking')}
                trend="neutral"
                accent="cyan"
                subtitle={kpiSubtitle}
              />
              <KPICard
                label="Recepcion"
                value={(kpiSource.main?.recepcion ?? 0).toLocaleString()}
                trendValue={buildTrendValue('recepcion')}
                trend="neutral"
                accent="green"
                subtitle={kpiSubtitle}
              />
              <KPICard
                label="Contenedores"
                value={(kpiSource.main?.contenedores ?? 0).toLocaleString()}
                trendValue={buildTrendValue('contenedores')}
                trend="neutral"
                accent="amber"
                subtitle={kpiSubtitle}
              />
            </>
          )}
        </div>
      </section>

      {/* ---- Section 4: Sub-tabs + Content ---- */}
      <section className="flex flex-col gap-5">
        <SubTabs tabs={SUB_TABS} activeTab={activeTab} onChange={setActiveTab} />

        <div className="min-h-[400px]">
          {isLoading ? (
            <ContentSkeleton />
          ) : movimientos.length === 0 && hasActiveFilters ? (
            <EmptyState onClear={clearFilters} />
          ) : (
            <>
              {activeTab === 'picking' && <PickingTab movimientos={movimientos} turno={filteredTurno} />}
              {activeTab === 'recepcion' && <RecepcionTab movimientos={movimientos} />}
              {activeTab === 'movimientos' && <MovimientosTab movimientos={movimientos} />}
              {activeTab === 'rma' && <RmaTab movimientos={movimientos} />}
              {activeTab === 'ocupacion' && <OcupacionTab />}
              {activeTab === 'camiones' && <CamionesTab fecha={fecha} />}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
