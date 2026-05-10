'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ComposedChart, ReferenceLine, Cell,
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
  ingresados: number;
  ingresadosFlota: number;
  ingRetiMeli?: number;
  ingAndreani?: number;
  ingFlotaPropia?: number;
  ingOtros?: number;
}

interface EventoChartsProps {
  chartData: ChartDayRow[];
  targetBultos: number;
  volumenRetiMeli: number;
  volumenAndreani: number;
  volumenFlotaPropia: number;
  volumenOtros: number;
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

export function EventoCharts({ chartData, targetBultos, volumenRetiMeli, volumenAndreani, volumenFlotaPropia, volumenOtros }: EventoChartsProps) {
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

  const BACKLOG_TARGET = 15688;
  const metaDiaria = Math.round(targetBultos / chartData.length);

  // Total volumen = all 4 categories (global, no date filter)
  const totalVolumenIngresado = volumenRetiMeli + volumenAndreani + volumenFlotaPropia + volumenOtros;

  // Volumen por Transporte: each bar shows the 4 transport breakdown.
  // For historical days the snapshot 6am value is used; for today, live global total.
  // We distribute the total (d.ingresados) across the 4 categories proportionally
  // using the global ratios — the snapshot only stores the total and flota.
  // For today (last bar with live data) we use the real category splits.
  const lastDayWithIngresados = chartData.slice().reverse().find(d => (d.ingresados || 0) > 0)?.fecha;
  const totalGlobal = volumenRetiMeli + volumenAndreani + volumenFlotaPropia + volumenOtros;

  const volumenChartData = chartData.map(d => {
    const total = d.ingresados || 0;
    if (total === 0) return { fecha: d.fecha, retiMeli: 0, andreani: 0, flotaPropia: 0, otros: 0 };

    // If we have detailed breakdown from snapshot, use it!
    if (d.ingRetiMeli !== undefined || d.ingAndreani !== undefined || d.ingFlotaPropia !== undefined || d.ingOtros !== undefined) {
      return {
        fecha: d.fecha,
        retiMeli: d.ingRetiMeli || 0,
        andreani: d.ingAndreani || 0,
        flotaPropia: d.ingFlotaPropia || 0,
        otros: d.ingOtros || 0,
      };
    }

    // For today (live): use real category splits from the global totals
    if (d.fecha === lastDayWithIngresados && totalGlobal > 0) {
      return {
        fecha: d.fecha,
        retiMeli: volumenRetiMeli,
        andreani: volumenAndreani,
        flotaPropia: volumenFlotaPropia,
        otros: volumenOtros,
      };
    }

    // For historical snapshots: distribute proportionally using current global ratios
    if (totalGlobal > 0) {
      return {
        fecha: d.fecha,
        retiMeli: Math.round(total * volumenRetiMeli / totalGlobal),
        andreani: Math.round(total * volumenAndreani / totalGlobal),
        flotaPropia: Math.round(total * volumenFlotaPropia / totalGlobal),
        otros: Math.round(total * volumenOtros / totalGlobal),
      };
    }

    return { fecha: d.fecha, retiMeli: 0, andreani: 0, flotaPropia: total, otros: 0 };
  });

  // Calculate cumulative progress for the right Y-axis
  let accReal = 0;
  let accForecast = 0;
  const enrichedData = chartData.map(d => {
    accReal += d.totalBultos;
    accForecast += d.forecast;
    return {
      ...d,
      accReal,
      accForecast
    };
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Full-width: Picking B2C vs B2B (bultos/día) */}
      <ChartCard
        title="Forecast vs Picking"
        legend={
          <div className="flex gap-4 flex-wrap">
            <LegendDot color="#1E3A8A" label="B2C" />
            <LegendDot color="#7C3AED" label="B2B" />
            <LegendDot color="#CBD5E1" label="Forecast (Día)" />
            <LegendLine color="#10B981" label="Progreso Real (Acum.)" />
            <LegendLine color="#94A3B8" label="Progreso Forecast (Acum.)" dashed />
            <LegendLine color="#64748B" label="Meta Final" dashed />
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={enrichedData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="fecha" {...axisProps} />
            <YAxis {...axisProps} yAxisId="left" />
            <YAxis {...axisProps} yAxisId="right" orientation="right" />
            <Tooltip {...tooltipStyle} />
            
            {/* Daily Bars */}
            <Bar dataKey="bultosB2C" yAxisId="left" name="B2C" fill="#1E3A8A" radius={[2, 2, 0, 0]} barSize={14} />
            <Bar dataKey="bultosB2B" yAxisId="left" name="B2B" fill="#7C3AED" radius={[2, 2, 0, 0]} barSize={14} />
            <Bar dataKey="forecast" yAxisId="left" name="Forecast (Día)" fill="#CBD5E1" radius={[2, 2, 0, 0]} barSize={14} />
            
            {/* Final Meta Line */}
            <ReferenceLine 
              y={targetBultos} 
              yAxisId="right"
              stroke="#64748B" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              label={{ position: 'top', value: `Meta Final: ${targetBultos}`, fill: '#64748B', fontSize: 10 }}
            />
            
            {/* Cumulative Lines */}
            <Line
              type="monotone"
              dataKey="accForecast"
              yAxisId="right"
              name="Progreso Forecast (Acum.)"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="accReal"
              yAxisId="right"
              name="Progreso Real (Acum.)"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two-column: Viajes + Volumen por Transporte */}
      <div className="grid grid-cols-2 gap-4">
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

        <ChartCard
          title="Volumen por Transporte (Ingresados)"
          legend={
            <div className="flex gap-4 flex-wrap">
              <LegendDot color="#4F46E5" label="Retira Meli" />
              <LegendDot color="#F97316" label="Andreani" />
              <LegendDot color="#10B981" label="Flota Propia" />
              <LegendDot color="#9CA3AF" label="Otros" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={volumenChartData}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="fecha" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip
                {...tooltipStyle}
                formatter={(value: number, name: string) => [
                  value.toLocaleString('es-AR'),
                  name === 'retiMeli' ? 'Retira Meli' :
                  name === 'andreani' ? 'Andreani' :
                  name === 'flotaPropia' ? 'Flota Propia' : 'Otros',
                ]}
              />
              <Bar dataKey="retiMeli"   name="retiMeli"   fill="#4F46E5" radius={[2, 2, 0, 0]} barSize={10} />
              <Bar dataKey="andreani"   name="andreani"   fill="#F97316" radius={[2, 2, 0, 0]} barSize={10} />
              <Bar dataKey="flotaPropia" name="flotaPropia" fill="#10B981" radius={[2, 2, 0, 0]} barSize={10} />
              <Bar dataKey="otros"      name="otros"      fill="#9CA3AF" radius={[2, 2, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
