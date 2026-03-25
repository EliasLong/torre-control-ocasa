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
import type { MovimientoRaw } from '@/types';

interface FamiliaDonutProps {
  movimientos: MovimientoRaw[];
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

export function FamiliaDonut({ movimientos }: FamiliaDonutProps) {
  const chartData = useMemo(() => {
    const pickMoves = movimientos.filter(
      (m) =>
        m.tipoTransaccion.toLowerCase() === 'sales order pick' &&
        m.subTransferencia === 'PORTONES',
    );

    const familyMap = new Map<string, number>();
    for (const m of pickMoves) {
      const key = m.descripcion || 'Sin descripción';
      familyMap.set(key, (familyMap.get(key) ?? 0) + Math.abs(m.cantidad));
    }

    const sorted = Array.from(familyMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 9) return sorted;

    const top8 = sorted.slice(0, 8);
    const otrosValue = sorted.slice(8).reduce((sum, item) => sum + item.value, 0);
    return [...top8, { name: 'Otros', value: otrosValue }];
  }, [movimientos]);

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">
        Sin datos para esta fecha
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {chartData.map((_, index) => (
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
  );
}
