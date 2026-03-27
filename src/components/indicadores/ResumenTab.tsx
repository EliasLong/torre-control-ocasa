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
  { key: 'recepcion', label: 'Recepción', align: 'right' as const },
  { key: 'movimientos', label: 'Movimientos', align: 'right' as const },
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
        recepcion: d.recepcion,

        contenedores: d.contenedores,
      })),
    [filtered],
  );

  const tableData = useMemo(
    () =>
      filtered.map((d) => ({
        fecha: d.fecha,
        picking: d.picking,
        recepcion: d.recepcion,

        contenedores: d.contenedores,
      })),
    [filtered],
  );

  if (!filtered.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-sm text-[var(--color-text-muted)]">Sin datos historicos disponibles</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          El historial de indicadores se mostrara una vez que haya datos acumulados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Evolucion 30 dias
        </h3>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.4}
              horizontal={true}
              vertical={true}
            />
            <XAxis
              dataKey="fecha"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
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
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={{ stroke: 'var(--color-border)' }}
              label={{
                value: 'Recep. / Mov. / Cont.',
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                padding: '8px 12px',
              }}
              labelStyle={{
                color: 'var(--color-text-muted)',
                fontSize: 11,
                marginBottom: 6,
                fontWeight: 600,
              }}
              formatter={(value, name) => {
                const formatted = Number(value).toLocaleString();
                return [formatted + ' uds', String(name)];
              }}
              separator=": "
              cursor={{ stroke: 'var(--color-text-muted)', strokeDasharray: '4 4', opacity: 0.3 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="picking"
              name="Picking"
              stroke="var(--color-accent-cyan)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-bg-card)' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="recepcion"
              name="Recepcion"
              stroke="var(--color-accent-green)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-bg-card)' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="movimientos"
              name="Movimientos"
              stroke="var(--color-accent-amber)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-bg-card)' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="contenedores"
              name="Contenedores"
              stroke="var(--color-accent-red)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-bg-card)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Datos Historicos
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={TABLE_COLUMNS}
          emptyMessage="No hay datos historicos para el rango seleccionado."
        />
      </div>
    </div>
  );
}
