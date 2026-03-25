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
import { FacturacionDetalle } from '@/types';

interface DailyFacturacion {
  fecha: string;
  facturacion: FacturacionDetalle;
}

interface Props {
  data: DailyFacturacion[];
}

const SERVICES = [
  { key: 'picking', name: 'Picking', color: '#00D4FF' },
  { key: 'pallets_in', name: 'Pallets In', color: '#00E5A0' },
  { key: 'pallets_out', name: 'Pallets Out', color: '#A78BFA' },
  { key: 'contenedores', name: 'Contenedores', color: '#FF5C5C' },
  { key: 'guarda', name: 'Guarda', color: '#FFB547' },
  { key: 'apertura_planta', name: 'Apertura Planta', color: '#F472B6' },
] as const;

function formatMillions(value: number): string {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export function FacturacionBarChart({ data }: Props) {
  const chartData = data.map(d => ({
    fecha: d.fecha.slice(5),
    picking: d.facturacion.picking,
    pallets_in: d.facturacion.pallets_in,
    pallets_out: d.facturacion.pallets_out,
    contenedores: d.facturacion.contenedores,
    guarda: d.facturacion.guarda,
    apertura_planta: d.facturacion.apertura_planta,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData}>
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
        {SERVICES.map(s => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId="facturacion"
            fill={s.color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
