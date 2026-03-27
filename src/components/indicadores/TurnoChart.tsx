'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { TurnoBreakdown } from '@/types';

interface TurnoChartProps {
  data: TurnoBreakdown[];
}

export function TurnoChart({ data }: TurnoChartProps) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-1">
        <p className="text-sm text-[var(--color-text-muted)]">Sin datos de turno para esta fecha</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          El desglose por turno aparecera cuando haya movimientos registrados.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, bottom: 0, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={{ stroke: 'var(--color-border)' }}
        />
        <YAxis
          type="category"
          dataKey="turno"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 500 }}
          axisLine={{ stroke: 'var(--color-border)' }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          formatter={(value, name) => [Number(value).toLocaleString() + ' uds', String(name)]}
          cursor={{ fill: 'var(--color-accent-cyan)', opacity: 0.04 }}
        />
        <Bar dataKey="picking" name="Picking" fill="var(--color-accent-cyan)" barSize={20} radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="picking"
            position="right"
            formatter={(v) => Number(v).toLocaleString()}
            style={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
