'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TurnoChart } from './TurnoChart';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw, TurnoBreakdown } from '@/types';

interface PickingTabProps {
  movimientos: MovimientoRaw[];
  turno: TurnoBreakdown[];
}

const COLORS = [
  'var(--color-accent-cyan)',
  'var(--color-accent-green)',
  'var(--color-accent-amber)',
  'var(--color-accent-red)',
  '#A78BFA',
  '#F472B6',
  '#34D399',
  '#FBBF24',
  '#94A3B8',
];

const HORAS_POR_TURNO = 8;

const TURNO_ACCENT: Record<string, string> = {
  T1: 'var(--color-accent-cyan)',
  T2: 'var(--color-accent-green)',
  T3: 'var(--color-accent-amber)',
};

const TABLE_COLUMNS = [
  { key: 'articulo', label: 'Artículo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'subinventario', label: 'Subinventario' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

function isPicking(m: MovimientoRaw): boolean {
  return (
    m.tipoTransaccion.toLowerCase() === 'sales order pick' &&
    m.subTransferencia === 'PORTONES'
  );
}

function getCliente(m: MovimientoRaw): string {
  if (m.lpnTransferido.startsWith('B2C')) return 'B2C';
  if (m.lpnTransferido.startsWith('B2B')) return 'B2B';
  return m.tipoOrigen || 'Otro';
}

export function PickingTab({ movimientos, turno }: PickingTabProps) {
  const pickMoves = useMemo(
    () => movimientos.filter(isPicking),
    [movimientos],
  );

  // User pie chart data
  const userChartData = useMemo(() => {
    const userMap = new Map<string, number>();
    for (const m of pickMoves) {
      const user = m.usuario || 'SIN USUARIO';
      userMap.set(user, (userMap.get(user) ?? 0) + Math.abs(m.cantidad));
    }
    const sorted = Array.from(userMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    if (sorted.length <= 9) return sorted;
    const top8 = sorted.slice(0, 8);
    const otrosValue = sorted.slice(8).reduce((sum, item) => sum + item.value, 0);
    return [...top8, { name: 'Otros', value: otrosValue }];
  }, [pickMoves]);

  // Productivity per hour by turno
  const productividad = useMemo(() => {
    const turnoMap = new Map<string, number>();
    for (const m of pickMoves) {
      turnoMap.set(m.turno, (turnoMap.get(m.turno) ?? 0) + Math.abs(m.cantidad));
    }
    return Array.from(turnoMap.entries()).map(([turno, total]) => ({
      turno,
      total,
      porHora: Math.round(total / HORAS_POR_TURNO),
    }));
  }, [pickMoves]);

  const tableData = useMemo(
    () =>
      pickMoves.map((m) => ({
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        subinventario: m.subinventario,
        cliente: getCliente(m),
        usuario: m.usuario,
        turno: m.turno,
      })),
    [pickMoves],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Productividad por turno */}
      {productividad.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {productividad.map((p) => {
            const accent = TURNO_ACCENT[p.turno] ?? 'var(--color-accent-cyan)';
            return (
              <div
                key={p.turno}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 relative overflow-hidden"
              >
                {/* Accent top bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: accent }}
                />
                <p className="text-xs text-[var(--color-text-muted)] mb-2 mt-1 uppercase tracking-wide">
                  Turno {p.turno}
                </p>
                <p className="text-3xl font-bold" style={{ color: accent }}>
                  {p.porHora.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 mb-3">
                  unidades / hora
                </p>
                {/* Mini progress-like bar */}
                <div className="w-full h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (p.porHora / Math.max(...productividad.map(x => x.porHora))) * 100)}%`,
                      background: accent,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-2">
                  Total: {p.total.toLocaleString()} uds en {HORAS_POR_TURNO}h
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-28 gap-1">
          <p className="text-sm text-[var(--color-text-muted)]">Sin datos de productividad por turno</p>
          <p className="text-xs text-[var(--color-text-muted)] opacity-60">
            No se registraron movimientos de picking en la fecha seleccionada.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Picking por Turno */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Picking por Turno
          </h3>
          <TurnoChart data={turno} />
        </div>

        {/* Picking por Usuario */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Picking por Usuario
          </h3>
          {userChartData.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={280} className="flex-shrink-0 lg:max-w-[55%]">
                <PieChart>
                  <Pie
                    data={userChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {userChartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                    }}
                    formatter={(value) => Number(value).toLocaleString()}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Custom legend for better readability */}
              <div className="flex flex-col gap-1.5 w-full lg:w-auto">
                {userChartData.map((entry, index) => {
                  const total = userChartData.reduce((s, e) => s + e.value, 0);
                  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ background: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-[var(--color-text-primary)] truncate max-w-[120px]" title={entry.name}>
                        {entry.name}
                      </span>
                      <span className="text-[var(--color-text-muted)] ml-auto tabular-nums">
                        {entry.value.toLocaleString()}
                      </span>
                      <span className="text-[var(--color-text-muted)] tabular-nums w-10 text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-1">
              <p className="text-sm text-[var(--color-text-muted)]">Sin datos de picking por usuario</p>
              <p className="text-xs text-[var(--color-text-muted)] opacity-60">
                No se encontraron movimientos de picking asignados a usuarios.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabla detalle */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Detalle de Picking
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={TABLE_COLUMNS}
          searchKeys={['articulo', 'descripcion', 'usuario', 'cliente']}
        />
      </div>
    </div>
  );
}
