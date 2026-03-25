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
} from 'recharts';
import type { TurnoBreakdown } from '@/types';

interface TurnoChartProps {
  data: TurnoBreakdown[];
}

export function TurnoChart({ data }: TurnoChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">
        Sin datos para esta fecha
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 0, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          type="number"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="turno"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
          }}
        />
        <Legend />
        <Bar dataKey="picking" name="Picking" fill="var(--color-accent-cyan)" barSize={18} />
        <Bar dataKey="recepcion" name="Recepción" fill="var(--color-accent-amber)" barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
