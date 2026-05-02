'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ComposedChart, ReferenceLine,
} from 'recharts';

// ── Props ──────────────────────────────────────────────────────────────────
interface ChartDayRow {
  fecha: string;
  bultosB2C: number;
  bultosB2B: number;
  trips: number;
  pallets: number;
  totalBultos: number;
  despachadoReal: number;
  forecast: number;
}

interface EventoChartsProps {
  chartData: ChartDayRow[];
  targetBultos: number;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '11px',
    color: '#1A1A1A',
  },
};

const axisProps = {
  tick: { fill: '#6B7280', fontSize: 10 },
};

function ChartCard({ title, legend, children }: { title: string; legend?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[#E0E0E0] p-4">
      <div className="mb-1 text-sm font-bold text-[#1A1A1A]">{title}</div>
      {legend && <div className="mb-3">{legend}</div>}
      {children}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#6B7280]">
      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}

function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-[#6B7280]">
      <span
        className="inline-block h-0.5 w-5"
        style={{
          background: dashed ? 'transparent' : color,
          borderTop: dashed ? `2px dashed ${color}` : undefined,
          height: dashed ? 0 : undefined,
        }}
      />
      {label}
    </span>
  );
}

export function EventoCharts({ chartData, targetBultos }: EventoChartsProps) {
  if (!chartData || chartData.length === 0) return null;

  // Derived data for specific charts
  const avgTrips = Math.round(chartData.reduce((s, d) => s + d.trips, 0) / chartData.length);

  // Find last day with actual data to calculate current pace
  let lastDayWithDataIndex = -1;
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (chartData[i].totalBultos > 0) {
      lastDayWithDataIndex = i;
      break;
    }
  }

  const daysElapsed = lastDayWithDataIndex + 1;
  let totalPickedSoFar = 0;
  for (let j = 0; j <= lastDayWithDataIndex; j++) {
    totalPickedSoFar += chartData[j].totalBultos;
  }
  const avgPace = daysElapsed > 0 ? totalPickedSoFar / daysElapsed : 0;

  const metaDiaria = Math.round(targetBultos / chartData.length);
  const flowChartData = chartData.map((d, i) => {
    return {
      fecha: d.fecha,
      volumen: d.ingresados || 0,
      despachadoReal: d.despachadoReal || 0,
      backlog: metaDiaria, // Meta dividida por día
    };
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Full-width: Total bultos por día */}
      <ChartCard
        title="Pedidos despachados vs. forecast diario"
        legend={
          <div className="flex gap-4">
            <LegendDot color="#C6D6F2" label="Forecast" />
            <LegendDot color="#729C34" label="Despachado real" />
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="fecha" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="forecast" name="Forecast" fill="#C6D6F2" radius={[2, 2, 0, 0]} barSize={28} />
            <Bar dataKey="despachadoReal" name="Despachado real" fill="#729C34" radius={[2, 2, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two-column: Picking B2C vs B2B + Camiones/viajes */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          title="Picking B2C vs B2B (bultos/día)"
          legend={
            <div className="flex gap-4">
              <LegendDot color="#1E3A8A" label="B2C" />
              <LegendDot color="#7C3AED" label="B2B" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="fecha" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="bultosB2C" name="B2C" fill="#1E3A8A" radius={[2, 2, 0, 0]} barSize={14} />
              <Bar dataKey="bultosB2B" name="B2B" fill="#7C3AED" radius={[2, 2, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Viajes (camiones) despachados por día"
          legend={
            <div className="flex gap-4">
              <LegendDot color="#ffab40" label="Viajes" />
              <LegendLine color="#6B7280" label="Promedio" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="fecha" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="trips" name="Viajes" fill="#ffab40" radius={[2, 2, 0, 0]} barSize={28} />
              <ReferenceLine y={avgTrips} stroke="#6B7280" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Two-column: Acumulado + Pallets */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard
          title="Backlog (Volumen vs Despachados vs Meta)"
          legend={
            <div className="flex gap-4">
              <LegendDot color="#F59E0B" label="Volumen" />
              <LegendDot color="#10B981" label="Despachados" />
              <LegendLine color="#E53935" label="Backlog real" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={flowChartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="fecha" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="volumen" name="Volumen" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={12} />
              <Bar dataKey="despachadoReal" name="Despachados" fill="#10B981" radius={[2, 2, 0, 0]} barSize={12} />
              <Line
                type="step"
                dataKey="backlog"
                name="Backlog Real"
                stroke="#E53935"
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Pallets despachados por día"
          legend={
            <div className="flex gap-4">
              <LegendDot color="#0099A8" label="Pallets" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="fecha" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="pallets" name="Pallets" fill="#0099A8" radius={[2, 2, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
