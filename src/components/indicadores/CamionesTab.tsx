'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Truck, Package, Building2, Clock, ArrowDownToLine, ArrowUpFromLine, X } from 'lucide-react';
import type { CamionMovimiento, CamionesDiariosData } from '@/types';

interface CamionesTabProps {
  fecha: string; // YYYY-MM-DD
}

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error('Error fetching camiones');
    return res.json() as Promise<CamionesDiariosData>;
  });

// --- Sub-components ---

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </p>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <p className="text-3xl font-bold mt-2" style={{ color: accent }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: CamionMovimiento['estado'] }) {
  if (estado === 'en_predio') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-accent-green)]/15 text-[var(--color-accent-green)] border border-[var(--color-accent-green)]/25">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-green)] animate-pulse" />
        En predio
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--color-border)]/40 text-[var(--color-text-muted)] border border-[var(--color-border)]">
      Egresado
    </span>
  );
}

function ContenedorBadge({ contenedor }: { contenedor: string | null }) {
  if (!contenedor) {
    return <span className="text-xs text-[var(--color-text-muted)]">—</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[var(--color-accent-amber)]/15 text-[var(--color-accent-amber)] border border-[var(--color-accent-amber)]/25">
      <Package size={9} />
      {contenedor}
    </span>
  );
}

type FiltroEstado = 'todos' | 'en_predio' | 'egresado';

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[var(--color-border)]/20" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[var(--color-border)]/15" />
    </div>
  );
}

// --- Main component ---

export function CamionesTab({ fecha }: CamionesTabProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');
  const [busqueda, setBusqueda] = useState('');

  const { data, error, isLoading } = useSWR(
    `/api/camiones?fecha=${fecha}`,
    fetcher,
    { keepPreviousData: true },
  );

  const camiones = data?.camiones ?? [];

  const stats = useMemo(() => {
    const enPredio = camiones.filter(c => c.estado === 'en_predio').length;
    const egresados = camiones.filter(c => c.estado === 'egresado').length;
    const contenedores = camiones.filter(c => c.contenedor).length;
    return { total: camiones.length, enPredio, egresados, contenedores };
  }, [camiones]);

  const filtered = useMemo(() => {
    let list = camiones;
    if (filtroEstado !== 'todos') {
      list = list.filter(c => c.estado === filtroEstado);
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      list = list.filter(
        c =>
          c.patente.toLowerCase().includes(q) ||
          c.empresa.toLowerCase().includes(q) ||
          (c.contenedor ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [camiones, filtroEstado, busqueda]);

  if (isLoading) return <Skeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--color-accent-red)]/10 flex items-center justify-center">
          <X size={18} className="text-[var(--color-accent-red)]" />
        </div>
        <p className="text-sm text-[var(--color-accent-red)] font-medium">
          Error al cargar movimiento de camiones
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Verificar conexión al Sheet o nombre de la pestaña (SHEET_CAMIONES_TAB)
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Camiones hoy"
          value={stats.total}
          icon={Truck}
          accent="var(--color-accent-cyan)"
          sub="ingresos registrados"
        />
        <StatCard
          label="En predio"
          value={stats.enPredio}
          icon={ArrowDownToLine}
          accent="var(--color-accent-green)"
          sub="actualmente dentro"
        />
        <StatCard
          label="Egresados"
          value={stats.egresados}
          icon={ArrowUpFromLine}
          accent="var(--color-text-muted)"
          sub="completaron ciclo"
        />
        <StatCard
          label="Con contenedor"
          value={stats.contenedores}
          icon={Package}
          accent="var(--color-accent-amber)"
          sub="recepciones de cont."
        />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Estado filter pills */}
        <div className="flex items-center gap-1.5">
          {(['todos', 'en_predio', 'egresado'] as FiltroEstado[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                filtroEstado === f
                  ? 'bg-[var(--color-accent-cyan)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'en_predio' ? 'En predio' : 'Egresados'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="sm:ml-auto">
          <input
            type="text"
            placeholder="Buscar patente, empresa o contenedor..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-border)]/30 flex items-center justify-center">
              <Truck size={20} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-sm text-[var(--color-text-muted)]">
              {camiones.length === 0
                ? 'Sin movimientos de camiones registrados para hoy'
                : 'Sin resultados para los filtros aplicados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-border)]/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Patente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Contenedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <ArrowDownToLine size={10} />
                      Ingreso
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <ArrowUpFromLine size={10} />
                      Egreso
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr
                    key={`${c.patente}-${idx}`}
                    className="border-b border-[var(--color-border)]/50 last:border-0 hover:bg-[var(--color-border)]/10 transition-colors"
                  >
                    {/* Patente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-cyan)]/10 flex items-center justify-center flex-shrink-0">
                          <Truck size={12} className="text-[var(--color-accent-cyan)]" />
                        </div>
                        <span className="font-mono font-semibold text-[var(--color-text-primary)] text-sm tracking-wide">
                          {c.patente || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Contenedor */}
                    <td className="px-4 py-3">
                      <ContenedorBadge contenedor={c.contenedor} />
                    </td>

                    {/* Empresa */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
                        <Building2 size={11} className="text-[var(--color-text-muted)] flex-shrink-0" />
                        <span className="text-xs">{c.empresa || '—'}</span>
                      </div>
                    </td>

                    {/* Ingreso */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[var(--color-accent-green)]">
                        <Clock size={10} />
                        <span className="font-mono text-xs tabular-nums">
                          {c.horaIngreso ?? '—'}
                        </span>
                      </div>
                    </td>

                    {/* Egreso */}
                    <td className="px-4 py-3">
                      {c.horaEgreso ? (
                        <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                          <Clock size={10} />
                          <span className="font-mono text-xs tabular-nums">{c.horaEgreso}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      <EstadoBadge estado={c.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          Mostrando {filtered.length} de {camiones.length} registros
        </p>
      )}
    </div>
  );
}
