'use client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface EvolItem { mes: string; mermaPorc: number; }
interface CatItem { categoria: string; monto: number; }
interface Props { evolutivo: EvolItem[]; porCategoria: CatItem[]; objetivo: number; }

export function MermaChart({ evolutivo, porCategoria, objetivo }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm text-[var(--color-text-muted)] mb-3">Merma % por Mes</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolutivo}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="mes" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <Tooltip />
            <ReferenceLine y={objetivo} stroke="var(--color-accent-red)" strokeDasharray="4 4" label={{ value: `Obj: ${objetivo}%`, fill: 'var(--color-accent-red)', fontSize: 10 }} />
            <Line type="monotone" dataKey="mermaPorc" name="Merma %" stroke="var(--color-accent-cyan)" strokeWidth={2} dot={{ fill: 'var(--color-accent-cyan)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div>
        <h3 className="text-sm text-[var(--color-text-muted)] mb-3">Merma por Categoría ($)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={porCategoria} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickFormatter={v => `$${(v/1_000_000).toFixed(0)}M`} />
            <YAxis type="category" dataKey="categoria" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <Tooltip formatter={(v) => `$${(Number(v)/1_000_000).toFixed(1)}M`} />
            <Bar dataKey="monto" name="Monto" fill="var(--color-accent-amber)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
