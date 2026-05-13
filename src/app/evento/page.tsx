'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { EventoHeader } from '@/components/evento/EventoHeader';
import { DayTabs } from '@/components/evento/DayTabs';
import { EventoCard } from '@/components/evento/EventoCard';
import { EventoCharts } from '@/components/evento/EventoCharts';
import { RefreshCw, CheckCircle2, Radio } from 'lucide-react';
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
  pendientePreparo: number;
  camionesB2C: number;
  availableDays: string[];
}

interface ResultadoFinal {
  date: string;
  dateKey: string;  // DD/MM
  pick_b2c: number;
  pick_b2b: number;
  total: number;
  source: string;
  imported_at: string;
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
  const [resultadosFinales, setResultadosFinales] = useState<ResultadoFinal[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisRes, rfRes] = await Promise.all([
        fetch('/api/evento/kpis', { cache: 'no-store' }),
        fetch('/api/evento/resultados-finales', { cache: 'no-store' }),
      ]);
      if (!kpisRes.ok) throw new Error('Error al obtener datos');
      const json: EventoKPIsResponse = await kpisRes.json();
      setData(json);
      // Auto-select today if available, otherwise last day with data
      if (!activeDay && json.availableDays.length > 0) {
        const todayStr = formatDateKey(new Date());
        if (json.availableDays.includes(todayStr)) {
          setActiveDay(todayStr);
        } else {
          setActiveDay(json.availableDays[json.availableDays.length - 1]);
        }
      }
      if (rfRes.ok) {
        const rfJson = await rfRes.json();
        setResultadosFinales(rfJson.resultados || []);
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
  const daysWithData = (data?.availableDays || []).filter(dk => {
    const d = data!.byDay[dk];
    return (d.bultosB2C + d.bultosB2B) > 0;
  }).length;
  const avgBultosPerDay = daysWithData > 0 ? Math.round(totalBultos / daysWithData) : 0;
  const targetBultos = 15888;

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

  const BACKLOG_TARGET = 15888;
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
      <EventoHeader diaEvento={diaEventoStr} avance={avancePercentage} estado={estadoGeneral} targetBultos={targetBultos} bultosIngresados={totalBultos} loadingPedidos={false} pendientePreparo={data?.pendientePreparo ?? null} />

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
                label="Total Camiones Despachados"
                value={fmt(totalTrips)}
                subtitle="Acumulado"
                accent="amber"
              />
              <EventoCard
                label="Forecast Pendiente"
                value={fmt(backlogDiff)}
                subtitle={`Meta: ${fmt(BACKLOG_TARGET)}`}
                accent={isBacklogComplete ? "green" : "red"}
                highlight
              />
              <EventoCard
                label="Días para la meta"
                value={estDaysRemaining > 0 ? estDaysRemaining : (isBacklogComplete ? "¡Meta!" : "-")}
                subtitle="Basado en ritmo actual"
                accent="blue"
              />
            </div>
          </section>

          {/* ── RESULTADOS FINALES OFICIALES ── */}
          {resultadosFinales.length > 0 && (
            <section className="mb-5">
              <h2
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: '#6B7280' }}
              >
                Resultados Finales Oficiales — Pick por Día
              </h2>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Día</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#7C3AED', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pick B2C</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#7C3AED', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pick B2B</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#111827', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                      <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.availableDays || []).map((dk, i) => {
                      const rf = resultadosFinales.find(r => r.dateKey === dk);
                      const liveDay = data?.byDay[dk];
                      const liveB2C = liveDay?.bultosB2C || 0;
                      const liveB2B = liveDay?.bultosB2B || 0;
                      const isOficial = !!rf;
                      const b2c   = isOficial ? rf!.pick_b2c : liveB2C;
                      const b2b   = isOficial ? rf!.pick_b2b : liveB2B;
                      const total = b2c + b2b;
                      return (
                        <tr
                          key={dk}
                          style={{
                            borderBottom: i < (data?.availableDays.length || 0) - 1 ? '1px solid #F3F4F6' : 'none',
                            background: isOficial ? 'rgba(124,58,237,0.03)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '10px 16px', color: '#6B7280', fontWeight: 600 }}>D{i + 1}</td>
                          <td style={{ padding: '10px 16px', color: '#374151', fontWeight: 600 }}>{dk}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#7C3AED', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {b2c.toLocaleString('es-AR')}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#7C3AED', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {b2b.toLocaleString('es-AR')}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#111827', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                            {total.toLocaleString('es-AR')}
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                            {isOficial ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'rgba(16,185,129,0.1)',
                                  color: '#059669',
                                  borderRadius: 20,
                                  padding: '2px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                }}
                              >
                                <CheckCircle2 size={11} />
                                OFICIAL
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'rgba(245,158,11,0.1)',
                                  color: '#D97706',
                                  borderRadius: 20,
                                  padding: '2px 10px',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                }}
                              >
                                <Radio size={11} />
                                EN VIVO
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #E5E7EB', background: '#F9FAFB' }}>
                      <td colSpan={2} style={{ padding: '10px 16px', fontWeight: 800, color: '#111827', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL EVENTO</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#7C3AED', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                        {(
                          resultadosFinales.length > 0
                            ? resultadosFinales.reduce((s, r) => s + r.pick_b2c, 0)
                            : (data?.totals.bultosB2C || 0)
                        ).toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#7C3AED', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                        {(
                          resultadosFinales.length > 0
                            ? resultadosFinales.reduce((s, r) => s + r.pick_b2b, 0)
                            : (data?.totals.bultosB2B || 0)
                        ).toLocaleString('es-AR')}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#111827', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                        {(
                          resultadosFinales.length > 0
                            ? resultadosFinales.reduce((s, r) => s + r.pick_b2c + r.pick_b2b, 0)
                            : ((data?.totals.bultosB2C || 0) + (data?.totals.bultosB2B || 0))
                        ).toLocaleString('es-AR')}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 6, textAlign: 'right' }}>
                Los resultados OFICIALES se importan automáticamente a las 4AM desde el sheet "Acumulado Evento".
              </p>
            </section>
          )}

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
