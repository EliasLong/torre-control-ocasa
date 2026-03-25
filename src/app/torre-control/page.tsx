'use client';

import useSWR from 'swr';
import { KPICard } from '@/components/kpi/KPICard';
import { Package, Truck, Warehouse, Users, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { TorreControlData, AlertaOperativa } from '@/lib/mock/torre-control.mock';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error fetching data');
  return res.json() as Promise<TorreControlData>;
});

const ALERT_CONFIG = {
  critical: { icon: AlertCircle, color: 'var(--color-accent-red)', bg: 'var(--color-accent-red)' },
  warning: { icon: AlertTriangle, color: 'var(--color-accent-amber)', bg: 'var(--color-accent-amber)' },
  info: { icon: Info, color: 'var(--color-accent-cyan)', bg: 'var(--color-accent-cyan)' },
} as const;

export default function TorreControlPage() {
  const { data, error, isLoading } = useSWR('/api/torre-control', fetcher, { refreshInterval: 30000 });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-accent-red)]">
        Error al cargar datos. Intente nuevamente.
      </div>
    );
  }

  const loading = isLoading || !data;
  const placeholder = '...';

  const ocupacion = data ? Math.round((data.posicionesOcupadas / data.posicionesTotales) * 100) : 0;
  const asistencia = data ? Math.round((data.jornalesPresentes / data.jornalesTotales) * 100) : 0;
  const totalPalletsOut = data ? data.palletsOutB2C + data.palletsOutB2B : 0;
  const pickingTotal = data ? data.pickingCompletado + data.pickingPendiente : 0;
  const pickingPct = data ? Math.round((data.pickingCompletado / pickingTotal) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Torre de Control</h1>
        <span className="text-sm text-[var(--color-text-muted)]">
          Movimientos del día: {data?.fecha ?? 'Hoy'}
        </span>
      </div>

      {/* Inbound KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Truck size={18} className="text-[var(--color-accent-cyan)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">Inbound</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard
            label="Contenedores Recibidos"
            value={loading ? placeholder : data.contenedoresRecibidos}
            trendValue={loading ? '' : `${data.contenedoresPendientes} pendientes`}
            trend={data && data.contenedoresPendientes > 0 ? 'down' : 'up'}
          />
          <KPICard
            label="Pallets IN"
            value={loading ? placeholder : data.palletsIn.toLocaleString()}
            trend="neutral"
          />
          <KPICard
            label="Contenedores Pendientes"
            value={loading ? placeholder : data.contenedoresPendientes}
            trend={data && data.contenedoresPendientes > 0 ? 'down' : 'up'}
          />
        </div>
      </section>

      {/* Storage KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Warehouse size={18} className="text-[var(--color-accent-cyan)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">Almacén</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KPICard
            label="Ocupación"
            value={loading ? placeholder : `${ocupacion}%`}
            trendValue={loading ? '' : `${data.posicionesOcupadas.toLocaleString()} / ${data.posicionesTotales.toLocaleString()} posiciones`}
            trend={ocupacion > 90 ? 'down' : 'up'}
          />
        </div>
      </section>

      {/* Outbound KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package size={18} className="text-[var(--color-accent-cyan)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">Outbound</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Pallets OUT"
            value={loading ? placeholder : totalPalletsOut.toLocaleString()}
            trendValue={loading ? '' : `B2C: ${data.palletsOutB2C} | B2B: ${data.palletsOutB2B}`}
            trend="neutral"
          />
          <KPICard
            label="Picking Completado"
            value={loading ? placeholder : data.pickingCompletado.toLocaleString()}
            trendValue={loading ? '' : `${pickingPct}% completado`}
            trend={pickingPct >= 80 ? 'up' : 'down'}
          />
          <KPICard
            label="Picking Pendiente"
            value={loading ? placeholder : data.pickingPendiente.toLocaleString()}
            trend={data && data.pickingPendiente > 0 ? 'down' : 'up'}
          />
        </div>
      </section>

      {/* Workforce KPIs */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} className="text-[var(--color-accent-cyan)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide">Personal</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Asistencia"
            value={loading ? placeholder : `${asistencia}%`}
            trendValue={loading ? '' : `${data.jornalesPresentes} / ${data.jornalesTotales} jornales`}
            trend={asistencia >= 90 ? 'up' : 'down'}
          />
          <KPICard
            label="Picking / Jornal"
            value={loading ? placeholder : data.pickingPorJornal.toFixed(1)}
            trend="neutral"
          />
          <KPICard
            label="Pallets OUT / Jornal"
            value={loading ? placeholder : data.palletsOutPorJornal.toFixed(1)}
            trend="neutral"
          />
        </div>
      </section>

      {/* Alerts */}
      {data && data.alertas.length > 0 && (
        <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-4">
            Alertas del día
          </h2>
          <div className="space-y-2">
            {data.alertas.map((alerta: AlertaOperativa) => {
              const config = ALERT_CONFIG[alerta.tipo];
              const Icon = config.icon;
              return (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)]"
                  style={{ borderLeftWidth: 3, borderLeftColor: config.color }}
                >
                  <Icon size={16} style={{ color: config.color, marginTop: 2, flexShrink: 0 }} />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-text-primary)]">{alerta.mensaje}</p>
                    <span className="text-xs text-[var(--color-text-muted)]">{alerta.hora} hs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
