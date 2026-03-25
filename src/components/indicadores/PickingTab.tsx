'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FamiliaDonut } from './FamiliaDonut';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {productividad.map((p) => (
          <div
            key={p.turno}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4"
          >
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Turno {p.turno}</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {p.porHora.toLocaleString()} <span className="text-sm font-normal text-[var(--color-text-muted)]">uds/hora</span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Total: {p.total.toLocaleString()} uds en {HORAS_POR_TURNO}h
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por Familia */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Distribución por Familia
          </h3>
          <FamiliaDonut movimientos={pickMoves} />
        </div>

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
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={userChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
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
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, color: 'var(--color-text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">
              Sin datos
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
