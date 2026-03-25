'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface DailyResultado {
  fecha: string;
  resultado: number;
}

interface Props {
  data: DailyResultado[];
}

function formatMillions(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${(Math.abs(value) / 1_000_000).toFixed(1)}M`;
}

export function ResultadoChart({ data }: Props) {
  const chartData = data.map(d => ({
    fecha: d.fecha.slice(5),
    resultado: d.resultado,
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
          formatter={(value: any) => [formatMillions(Number(value)), 'Resultado']}
          contentStyle={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text-primary)',
          }}
          labelStyle={{ color: 'var(--color-text-muted)' }}
        />
        <Legend />
        <ReferenceLine y={0} stroke="var(--color-text-muted)" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="resultado"
          name="Resultado"
          stroke="#00E5A0"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
