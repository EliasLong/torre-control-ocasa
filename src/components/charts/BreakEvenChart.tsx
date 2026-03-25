'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';
import { FacturacionDetalle, CostosDetalle } from '@/types';

interface DailyDataPoint {
  fecha: string;
  facturacion: FacturacionDetalle;
  costos: CostosDetalle;
  resultado: number;
  margen: number;
}

interface Props {
  data: DailyDataPoint[];
  monthlyBase?: {
    guardaMensual: number;
    fijosMensuales: number;
  };
}

interface ChartPoint {
  fecha: string;
  costoFijo: number;
  costoVariableAcum: number;
  costoTotalAcum: number;
  facturacionAcum: number;
}

function formatMillions(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.round(Math.abs(value) / 1_000_000)}M`;
}

function findBreakEven(points: ChartPoint[]): { fecha: string; value: number } | null {
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const prevDiff = prev.facturacionAcum - prev.costoTotalAcum;
    const currDiff = curr.facturacionAcum - curr.costoTotalAcum;

    // Crossing: previous was negative (or zero), current is positive (or zero)
    if (prevDiff <= 0 && currDiff >= 0) {
      return { fecha: curr.fecha, value: curr.facturacionAcum };
    }
  }
  return null;
}

export function BreakEvenChart({ data, monthlyBase }: Props) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    // Use monthly base amounts (full month, not prorated)
    const costoFijoTotal = monthlyBase?.fijosMensuales ?? data.reduce((sum, d) => sum + d.costos.fijos, 0);
    const guardaMensual = monthlyBase?.guardaMensual ?? 0;

    let costoVariableAcum = 0;
    let facturacionOperativaAcum = 0;

    return data.map(d => {
      costoVariableAcum += d.costos.variables;
      // Facturacion operativa = total diario sin guarda (guarda ya se suma como base)
      const factSinGuarda = d.facturacion.total - (d.facturacion.guarda ?? 0);
      facturacionOperativaAcum += factSinGuarda;

      return {
        fecha: d.fecha,
        costoFijo: costoFijoTotal,
        costoVariableAcum,
        costoTotalAcum: costoFijoTotal + costoVariableAcum,
        facturacionAcum: guardaMensual + facturacionOperativaAcum,
      };
    });
  }, [data, monthlyBase]);

  const breakEven = useMemo(() => findBreakEven(chartData), [chartData]);

  if (!chartData.length) return null;

  return (
    <ResponsiveContainer width="100%" height={420}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, bottom: 0, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="fecha"
          tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
          tickFormatter={(v: string) => v.slice(5)}
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
        {/* Costo fijo: horizontal line (high from day 1) */}
        <Line
          type="monotone"
          dataKey="costoFijo"
          name="Costos Fijos"
          stroke="#FF5C5C"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
        />
        {/* Costo variable acumulado */}
        <Line
          type="monotone"
          dataKey="costoVariableAcum"
          name="Costos Variables (acum.)"
          stroke="#FFB547"
          strokeWidth={2}
          dot={false}
        />
        {/* Costo total acumulado = fijos + variables */}
        <Area
          type="monotone"
          dataKey="costoTotalAcum"
          name="Costo Total (acum.)"
          stroke="#FF5C5C"
          fill="#FF5C5C"
          fillOpacity={0.08}
          strokeWidth={2}
          dot={false}
        />
        {/* Facturación acumulada */}
        <Area
          type="monotone"
          dataKey="facturacionAcum"
          name="Facturación (acum.)"
          stroke="#00D4FF"
          fill="#00D4FF"
          fillOpacity={0.08}
          strokeWidth={3}
          dot={false}
        />
        {/* Break-even point */}
        {breakEven && (
          <>
            <ReferenceLine
              x={breakEven.fecha}
              stroke="#00E5A0"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ value: 'Break Even', position: 'top', fill: '#00E5A0', fontSize: 12, fontWeight: 'bold' }}
            />
            <ReferenceDot
              x={breakEven.fecha}
              y={breakEven.value}
              r={6}
              fill="#00E5A0"
              stroke="#fff"
              strokeWidth={2}
            />
          </>
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
