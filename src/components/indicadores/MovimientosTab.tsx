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
} from 'recharts';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';

interface MovimientosTabProps {
  movimientos: MovimientoRaw[];
}

const COLUMNS = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'articulo', label: 'Artículo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'tipoTransaccion', label: 'Tipo Transacción' },
  { key: 'subinventario', label: 'Subinventario' },
  { key: 'usuario', label: 'Usuario' },
];

export function MovimientosTab({ movimientos }: MovimientosTabProps) {
  const chartData = useMemo(() => {
    const typeMap = new Map<string, number>();
    for (const m of movimientos) {
      typeMap.set(m.tipoTransaccion, (typeMap.get(m.tipoTransaccion) ?? 0) + Math.abs(m.cantidad));
    }
    return Array.from(typeMap.entries())
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [movimientos]);

  const tableData = useMemo(
    () =>
      movimientos.map((m) => ({
        fecha: m.fecha,
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        tipoTransaccion: m.tipoTransaccion,
        subinventario: m.subinventario,
        usuario: m.usuario,
      })),
    [movimientos],
  );

  if (!movimientos.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
        Sin datos para esta fecha
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Cantidad por Tipo de Transacción
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="tipo"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              angle={-25}
              textAnchor="end"
            />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
              }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Bar dataKey="cantidad" name="Cantidad" fill="var(--color-accent-cyan)" barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Todos los Movimientos
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={COLUMNS}
          searchKeys={['articulo', 'descripcion', 'tipoTransaccion', 'usuario']}
          maxHeight="500px"
        />
      </div>
    </div>
  );
}
