'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';
import { ArrowLeftRight } from 'lucide-react';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';

interface MovimientosTabProps {
  movimientos: MovimientoRaw[];
}

const BAR_COLORS = [
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

const COLUMNS = [
  { key: 'articulo', label: 'Artículo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'subinventario', label: 'Subinventario' },
  { key: 'localizador', label: 'Localizador' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

export function MovimientosTab({ movimientos }: MovimientosTabProps) {
  const transferMoves = useMemo(
    () => movimientos.filter((m) => m.tipoTransaccion.toLowerCase() === 'subinventory transfer'),
    [movimientos],
  );

  const chartData = useMemo(() => {
    const subMap = new Map<string, number>();
    for (const m of transferMoves) {
      const key = m.subinventario || 'SIN SUBINV';
      subMap.set(key, (subMap.get(key) ?? 0) + Math.abs(m.cantidad));
    }
    return Array.from(subMap.entries())
      .map(([subinventario, cantidad]) => ({ subinventario, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [transferMoves]);

  const tableData = useMemo(
    () =>
      transferMoves.map((m) => ({
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        subinventario: m.subinventario,
        localizador: m.localizador,
        usuario: m.usuario,
        turno: m.turno,
      })),
    [transferMoves],
  );

  if (!transferMoves.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <ArrowLeftRight size={28} className="text-[var(--color-text-muted)] opacity-40" />
        <p className="text-sm text-[var(--color-text-muted)]">Sin movimientos de transferencia para esta fecha</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          Las transferencias entre subinventarios apareceran aqui cuando haya datos disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Cantidad por Subinventario
          </h3>
          <span className="text-xs text-[var(--color-text-muted)]">
            {chartData.length} subinventarios
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="subinventario"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              angle={-25}
              textAnchor="end"
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              formatter={(value) => [Number(value).toLocaleString() + ' uds', 'Cantidad']}
              labelStyle={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 4 }}
              cursor={{ fill: 'var(--color-accent-cyan)', opacity: 0.06 }}
            />
            <Bar dataKey="cantidad" name="Cantidad" radius={[4, 4, 0, 0]} barSize={32}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
              <LabelList
                dataKey="cantidad"
                position="top"
                formatter={(v) => Number(v).toLocaleString()}
                style={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Detalle Subinventory Transfer
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={COLUMNS}
          searchKeys={['articulo', 'descripcion', 'subinventario', 'usuario']}
          maxHeight="500px"
          emptyMessage="No se encontraron transferencias entre subinventarios."
        />
      </div>
    </div>
  );
}
