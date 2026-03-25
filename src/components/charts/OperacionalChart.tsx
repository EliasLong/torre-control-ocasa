'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  fecha: string;
  palletsOut: number;
  picking: number;
  palletsIn: number;
  contenedores: number;
}

interface Props {
  data: DataPoint[];
  capacidadPicking: number;
}

export function OperacionalChart({ data, capacidadPicking }: Props) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="fecha"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)}
        />
        {/* Left axis: Picking */}
        <YAxis
          yAxisId="left"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          label={{ value: 'Picking', angle: -90, position: 'insideLeft', fill: 'var(--color-text-muted)', fontSize: 11 }}
        />
        {/* Right axis: Pallets & Contenedores */}
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          label={{ value: 'Pallets / Cont.', angle: 90, position: 'insideRight', fill: 'var(--color-text-muted)', fontSize: 11 }}
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
        {/* Pallets & Contenedores on right axis as bars */}
        <Bar
          yAxisId="right"
          dataKey="palletsOut"
          name="Pallets OUT"
          fill="var(--color-accent-green)"
          opacity={0.7}
          barSize={14}
        />
        <Bar
          yAxisId="right"
          dataKey="palletsIn"
          name="Pallets IN"
          fill="var(--color-accent-cyan)"
          opacity={0.7}
          barSize={14}
        />
        <Bar
          yAxisId="right"
          dataKey="contenedores"
          name="Contenedores"
          fill="#A78BFA"
          opacity={0.7}
          barSize={14}
        />
        {/* Capacidad picking - dashed reference line */}
        <ReferenceLine
          yAxisId="left"
          y={capacidadPicking}
          stroke="var(--color-accent-red)"
          strokeDasharray="8 4"
          strokeWidth={2}
          label={{ value: `Cap. ${capacidadPicking.toLocaleString()}`, position: 'left', fill: 'var(--color-accent-red)', fontSize: 10 }}
        />
        {/* Picking as line on left axis to compare with capacity */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="picking"
          name="Picking"
          stroke="var(--color-accent-amber)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
