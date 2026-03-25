'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FacturacionDetalle, CostosDetalle } from '@/types';

interface DailyRecord {
  fecha: string;
  facturacion: FacturacionDetalle;
  costos: CostosDetalle;
}

interface Props {
  data: DailyRecord[];
}

function formatMillions(value: number): string {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export function FacturacionVsCostosChart({ data }: Props) {
  const chartData = data.map(d => ({
    fecha: d.fecha.slice(5),
    facturacion: d.facturacion.total,
    costos: d.costos.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="fecha"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
        />
        <YAxis
          tickFormatter={formatMillions}
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [formatMillions(Number(value)), String(name)]}
          contentStyle={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
          }}
          labelStyle={{ color: 'var(--color-text-muted)' }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="facturacion"
          name="Facturación"
          stroke="#00D4FF"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="costos"
          name="Costos"
          stroke="#FF5C5C"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
