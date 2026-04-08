'use client';

import { LayoutGrid, BarChart3, PieChart, Table2, Construction } from 'lucide-react';

/** Bloque placeholder con aspecto de wireframe */
function WireframeBlock({
  icon: Icon,
  label,
  height = 'h-32',
  width = 'w-full',
}: {
  icon: React.ElementType;
  label: string;
  height?: string;
  width?: string;
}) {
  return (
    <div
      className={`${height} ${width} rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-border)]/5 flex flex-col items-center justify-center gap-2 select-none`}
    >
      <Icon size={22} className="text-[var(--color-border)]" />
      <span className="text-xs text-[var(--color-text-muted)]/60 font-medium">{label}</span>
    </div>
  );
}

/** Card KPI skeleton */
function KpiSkeleton({ accent }: { accent: string }) {
  return (
    <div className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accent, opacity: 0.3 }} />
      <div className="mt-1 space-y-2">
        <div className="h-2.5 w-20 rounded bg-[var(--color-border)]/50" />
        <div className="h-8 w-14 rounded bg-[var(--color-border)]/40" />
        <div className="h-2 w-28 rounded bg-[var(--color-border)]/30" />
      </div>
    </div>
  );
}

export function OcupacionTab() {
  return (
    <div className="flex flex-col gap-6 pointer-events-none select-none">

      {/* Banner "Próximamente" */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-accent-amber)]/10 border border-[var(--color-accent-amber)]/25">
        <Construction size={16} className="text-[var(--color-accent-amber)] flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[var(--color-accent-amber)]">
            Módulo en desarrollo
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            El tablero de ocupación del depósito estará disponible próximamente.
            La vista a continuación es una maqueta de referencia.
          </p>
        </div>
      </div>

      {/* Row 1: KPI Cards placeholder */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiSkeleton accent="var(--color-accent-cyan)" />
        <KpiSkeleton accent="var(--color-accent-green)" />
        <KpiSkeleton accent="var(--color-accent-amber)" />
        <KpiSkeleton accent="var(--color-accent-red)" />
      </div>

      {/* Row 2: Mapa de planta + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa de planta — ocupa 2/3 */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Mapa de ocupación — Planta
            </span>
          </div>

          {/* Grid simulando sectores del depósito */}
          <div className="grid grid-cols-4 gap-2 h-48">
            {[
              { label: 'Nave A', pct: 78, color: 'var(--color-accent-amber)' },
              { label: 'Nave B', pct: 45, color: 'var(--color-accent-green)' },
              { label: 'Nave C', pct: 91, color: 'var(--color-accent-red)' },
              { label: 'Nave D', pct: 32, color: 'var(--color-accent-green)' },
              { label: 'Pasillo 1', pct: 60, color: 'var(--color-accent-cyan)' },
              { label: 'Pasillo 2', pct: 55, color: 'var(--color-accent-cyan)' },
              { label: 'Recepción', pct: 20, color: 'var(--color-accent-green)' },
              { label: 'Staging', pct: 70, color: 'var(--color-accent-amber)' },
            ].map(({ label, pct, color }) => (
              <div
                key={label}
                className="rounded-lg border border-[var(--color-border)] overflow-hidden flex flex-col justify-end relative"
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: color, height: `${pct}%`, top: 'auto', bottom: 0, position: 'absolute' }}
                />
                <div className="relative p-1.5">
                  <p className="text-[9px] font-semibold text-[var(--color-text-muted)]">{label}</p>
                  <p className="text-[11px] font-bold" style={{ color }}>{pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart placeholder */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Por familia
            </span>
          </div>
          <WireframeBlock icon={PieChart} label="Donut — Ocupación por familia" height="h-40" />
        </div>
      </div>

      {/* Row 3: Trend chart + table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Evolución de ocupación mensual
            </span>
          </div>
          <WireframeBlock icon={BarChart3} label="Gráfico de barras — Ocupación vs Capacidad" height="h-40" />
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Table2 size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Detalle por sector
            </span>
          </div>
          <WireframeBlock icon={Table2} label="Tabla — Pallets / Capacidad / % Ocupación" height="h-40" />
        </div>
      </div>
    </div>
  );
}
