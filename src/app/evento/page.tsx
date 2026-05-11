'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EventoHeader } from '@/components/evento/EventoHeader';
import { DayTabs } from '@/components/evento/DayTabs';
import { EventoCard } from '@/components/evento/EventoCard';
import { EventoCharts } from '@/components/evento/EventoCharts';
import { RefreshCw } from 'lucide-react';
import { usePedidosIngresados } from '@/hooks/usePedidosIngresados';

// ── Types matching the API response ────────────────────────────────────────
interface DayKPIs {
  dateKey: string;
  bultosB2C: number;
  bultosB2B: number;
  palletsB2C: number;
  palletsB2B: number;
  tripsB2C: number;
  tripsB2B: number;
  viajesTotal: number;
  despachadosBultos: number;
  camionesDespB2B: number;
  devoluciones: number;
  incidencias: number;
}

interface EventoKPIsResponse {
  byDay: Record<string, DayKPIs>;
  totals: {
    bultosB2C: number;
    bultosB2B: number;
    palletsB2C: number;
    palletsB2B: number;
    tripsB2C: number;
    tripsB2B: number;
    viajesTotal: number;
    despachadosBultos: number;
    camionesDespB2B: number;
    devoluciones: number;
    incidencias: number;
  };
  volumenRetiMeli: number;
  volumenAndreani: number;
  volumenFlotaPropia: number;
  volumenOtros: number;
  availableDays: string[];
}

// ── Helper to format numbers ───────────────────────────────────────────────
function fmt(n: number): string {
  return n.toLocaleString('es-AR');
}

function formatDateKey(d: Date): string {
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

export default function EventoPage() {
  const [data, setData] = useState<EventoKPIsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evento/kpis', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al obtener datos');
      const json: EventoKPIsResponse = await res.json();
      setData(json);
      // Auto-select last day with data if none selected
      if (!activeDay && json.availableDays.length > 0) {
        setActiveDay(json.availableDays[json.availableDays.length - 1]);
      }
    } catch (e: any) {
      setError(e.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [activeDay]);

  // Bultos Pickeados: (Eventual: switched to total picking sum)
  // const { total: bultosIngresados, loading: loadingPedidos, lastSync } = usePedidosIngresados();
  const bultosIngresados = 0;
  const loadingPedidos = false;

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build tabs from available days
  const dayTabs = (data?.availableDays || []).map((dk, i) => ({
    id: dk,
    label: `D${i + 1}`,
    date: dk,
  }));

  // Current day data
  const dayData: DayKPIs | null = data && activeDay ? data.byDay[activeDay] || null : null;

  // Totals
  const totals = data?.totals || {
    bultosB2C: 0, bultosB2B: 0, palletsB2C: 0, palletsB2B: 0,
    tripsB2C: 0, tripsB2B: 0, viajesTotal: 0,
    despachadosBultos: 0, camionesDespB2B: 0, devoluciones: 0, incidencias: 0
  };

  const totalBultos = totals.bultosB2C + totals.bultosB2B;
  const totalTrips = totals.viajesTotal;
  const totalPallets = totals.palletsB2C + totals.palletsB2B;
  const numDays = data?.availableDays.length || 1;
  const avgBultosPerDay = Math.round(totalBultos / numDays);
  const targetBultos = 15688;

  // Day-level
  const dayBultosB2C = dayData?.bultosB2C || 0;
  const dayBultosB2B = dayData?.bultosB2B || 0;
  const dayTotalBultos = dayBultosB2C + dayBultosB2B;
  const dayTrips = (dayData?.tripsB2C || 0) + (dayData?.tripsB2B || 0);
  const dayPallets = (dayData?.palletsB2C || 0) + (dayData?.palletsB2B || 0);
  const dayDespachadosBultos = dayData?.despachadosBultos || 0;
  const dayCamionesDespB2B = dayData?.camionesDespB2B || 0;
  const dayDevoluciones = dayData?.devoluciones || 0;
  const dayIncidencias = dayData?.incidencias || 0;
  const dayPickedTotal = dayBultosB2C + dayBultosB2B;
  const dayDevolucionesPct = dayPickedTotal > 0 ? (dayDevoluciones / dayPickedTotal * 100).toFixed(3) : "0.000";

  const BACKLOG_TARGET = 15688;
  const isBacklogComplete = totalBultos >= BACKLOG_TARGET;
  const backlogDiff = Math.max(0, BACKLOG_TARGET - totalBultos);

  // Días para completar meta: estimated days = backlogDiff / avgBultosPerDay
  const estDaysRemaining = !isBacklogComplete && avgBultosPerDay > 0
    ? Math.ceil(backlogDiff / avgBultosPerDay)
    : 0;

  // Chart data from all days
  const FORECAST_VALUES = [2510, 2823, 2823, 2510, 1255, 1570, 1098, 1099];
  const chartDays = (data?.availableDays || []).map((dk, index) => {
    const d = data!.byDay[dk];
    return {
      fecha: dk,
      bultosB2C: d?.bultosB2C || 0,
      bultosB2B: d?.bultosB2B || 0,
      trips: d?.viajesTotal || 0,
      pallets: (d?.palletsB2C || 0) + (d?.palletsB2B || 0),
      totalBultos: (d?.bultosB2C || 0) + (d?.bultosB2B || 0),
      despachadoReal: (d?.bultosB2C || 0) + (d?.bultosB2B || 0),
      forecast: FORECAST_VALUES[index] || 0,
      ingresados: d?.ingresados || 0,
      ingresadosFlota: d?.ingresadosFlota || 0,
      ingRetiMeli: d?.ingRetiMeli,
      ingAndreani: d?.ingAndreani,
      ingFlotaPropia: d?.ingFlotaPropia,
      ingOtros: d?.ingOtros,
    };
  });

  // Header computed stats
  const todayKey = formatDateKey(new Date());
  const todayIndex = data?.availableDays.indexOf(todayKey) ?? -1;
  const activeDayIndex = data?.availableDays.indexOf(activeDay) ?? 0;
  
  // Use today's position in the event for the goal, or the latest available day if today is not in the list
  const currentEventDay = todayIndex !== -1 ? todayIndex + 1 : (data?.availableDays.length || 1);
  
  const diaEventoStr = (activeDayIndex + 1).toString();
  const avancePercentage = Math.min(100, Math.round((totalBultos / targetBultos) * 100));
  
  // To be "Al Día", you must have at least 1 bulto and meet the proportional goal for the current day
  const goalPercentage = currentEventDay * (100 / 8);
  const estadoGeneral = (totalBultos > 0 && avancePercentage >= goalPercentage) ? 'Al Día' : 'Atrasado';

  return (
    <div
      className="flex flex-col gap-0 min-h-screen"
      style={{ background: '#F5F5F5', fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Header */}
      <EventoHeader diaEvento={diaEventoStr} avance={avancePercentage} estado={estadoGeneral} targetBultos={targetBultos} bultosIngresados={totalBultos} loadingPedidos={false} />

      {/* Refresh + Day selector + Backlog input */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all"
            style={{
              borderColor: '#D1D5DB',
              color: loading ? '#9CA3AF' : '#374151',
              background: '#fff',
            }}
            title="Actualizar datos"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>

      {dayTabs.length > 0 && (
        <DayTabs days={dayTabs} activeDay={activeDay} onSelect={setActiveDay} />
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-gray-400" />
        </div>
      )}

      {data && (
        <>
          {/* ── RESUMEN DEL DÍA SELECCIONADO ── */}
          <section className="mb-4">
            <h2
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#6B7280' }}
            >
              Resumen del día seleccionado — {activeDay}
            </h2>
            <div className="grid grid-cols-6 gap-3">
              <EventoCard
                label="Bultos despachados"
                value={fmt(dayDespachadosBultos)}
                subtitle="Bultos del día"
                accent="green"
              />
              <EventoCard
                label="Pick. B2C"
                value={fmt(dayBultosB2C)}
                subtitle="Tareas + Bultos"
                accent="purple"
              />
              <EventoCard
                label="Pick. B2B"
                value={fmt(dayBultosB2B)}
                subtitle="Bultos"
                accent="purple"
              />
              <EventoCard
                label="Camiones Desp."
                value={fmt(dayCamionesDespB2B)}
                subtitle="B2B (Liberado)"
                accent="amber"
              />
               <EventoCard
                label="Devoluciones"
                value={fmt(dayDevoluciones)}
                subtitle="Bultos del día"
                accent="cyan"
              />
              <EventoCard
                label="Incidencias"
                value={fmt(dayIncidencias)}
                subtitle="Cantidad del día"
                accent="red"
              />
            </div>
          </section>

          {/* ── ACUMULADO DEL EVENTO ── */}
          <section className="mb-5">
            <h2
              className="text-[10px] font-bold uppercase tracking-widest mb-2"
              style={{ color: '#6B7280' }}
            >
              Acumulado del evento
            </h2>
            <div className="grid grid-cols-6 gap-3">
              <EventoCard
                label="Total Bultos despachados"
                value={fmt(totals.despachadosBultos)}
                subtitle="Acumulado"
                accent="green"
              />
              <EventoCard
                label="Pick. B2C Total"
                value={fmt(totals.bultosB2C)}
                subtitle="Acumulado"
                accent="purple"
              />
              <EventoCard
                label="Pick. B2B Total"
                value={fmt(totals.bultosB2B)}
                subtitle="Acumulado"
                accent="purple"
              />
              <EventoCard
                label="Total viajes"
                value={fmt(totalTrips)}
                subtitle="Acumulado"
                accent="amber"
              />
              <EventoCard
                label="Backlog pendiente"
                value={fmt(backlogDiff)}
                subtitle={`Meta: ${fmt(BACKLOG_TARGET)}`}
                accent={isBacklogComplete ? "green" : "red"}
                highlight
              />
              <EventoCard
                label="Días para completar meta"
                value={!isBacklogComplete ? `${estDaysRemaining} días` : "Completado"}
                subtitle={!isBacklogComplete ? `Ritmo: ${fmt(avgBultosPerDay)}/día` : "Meta alcanzada"}
                accent="cyan"
              />
            </div>
          </section>

          {/* ── CHARTS ── */}
          <EventoCharts
            chartData={chartDays}
            targetBultos={targetBultos}
            volumenRetiMeli={data?.volumenRetiMeli || 0}
            volumenAndreani={data?.volumenAndreani || 0}
            volumenFlotaPropia={data?.volumenFlotaPropia || 0}
            volumenOtros={data?.volumenOtros || 0}
          />
        </>
      )}
    </div>
  );
}
