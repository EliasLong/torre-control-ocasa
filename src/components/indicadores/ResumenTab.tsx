'use client';

import { useMemo } from 'react';
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
import { IndicadoresTable } from './IndicadoresTable';
import type { IndicadorDiario } from '@/types';

interface ResumenTabProps {
  historico: IndicadorDiario[];
}

const TABLE_COLUMNS = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'picking', label: 'Picking', align: 'right' as const },
  { key: 'pallet_in', label: 'Pallet In', align: 'right' as const },
  { key: 'pallet_out', label: 'Pallet Out', align: 'right' as const },
  { key: 'contenedores', label: 'Contenedores', align: 'right' as const },
];

function formatDateDDMM(fecha: string): string {
  const parts = fecha.split('-');
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
  return fecha;
}

export function ResumenTab({ historico }: ResumenTabProps) {
  const filtered = useMemo(
    () =>
      historico
        .filter((d) => d.org === 'Total' || !d.org)
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(-30),
    [historico],
  );

  const chartData = useMemo(
    () =>
      filtered.map((d) => ({
        fecha: formatDateDDMM(d.fecha),
        picking: d.picking,
        pallet_in: d.pallet_in,
        pallet_out: d.pallet_out,
        contenedores: d.contenedores,
      })),
    [filtered],
  );

  const tableData = useMemo(
    () =>
      filtered.map((d) => ({
        fecha: d.fecha,
        picking: d.picking,
        pallet_in: d.pallet_in,
        pallet_out: d.pallet_out,
        contenedores: d.contenedores,
      })),
    [filtered],
  );

  if (!filtered.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
        Sin datos históricos disponibles
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Evolución 30 días
        </h3>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="fecha"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              label={{
                value: 'Picking',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--color-text-muted)',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              label={{
                value: 'Pallets / Cont.',
                angle: 90,
                position: 'insideRight',
                fill: 'var(--color-text-muted)',
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-primary)',
              }}
              formatter={(value) => Number(value).toLocaleString()}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="picking"
              name="Picking"
              stroke="var(--color-accent-cyan)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pallet_in"
              name="Pallet In"
              stroke="var(--color-accent-green)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pallet_out"
              name="Pallet Out"
              stroke="var(--color-accent-amber)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="contenedores"
              name="Contenedores"
              stroke="var(--color-accent-red)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Datos Históricos
        </h3>
        <IndicadoresTable data={tableData} columns={TABLE_COLUMNS} />
      </div>
    </div>
  );
}
