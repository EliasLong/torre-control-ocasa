'use client';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint { fecha: string; venta: number; costo: number; presupuesto: number; }
interface Props { data: DataPoint[]; }

export function FinancieroChart({ data }: Props) {
  const tickFmt = (v: number) => `$${(v/1_000_000).toFixed(1)}M`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipFmt = (v: any) => `$${(Number(v)/1_000_000).toFixed(1)}M`;
  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="fecha" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <YAxis tickFormatter={tickFmt} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
        <Tooltip formatter={tooltipFmt} contentStyle={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
        <Legend />
        <Area type="monotone" dataKey="venta" name="Venta" fill="#00D4FF" stroke="#00D4FF" fillOpacity={0.15} />
        <Area type="monotone" dataKey="costo" name="Costo" fill="#FF5C5C" stroke="#FF5C5C" fillOpacity={0.15} />
        <Line type="monotone" dataKey="presupuesto" name="Presupuesto" stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
