'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { KPICard } from '@/components/kpi/KPICard';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';
import { Package, Boxes } from 'lucide-react';

interface RecepcionTabProps {
  movimientos: MovimientoRaw[];
}

const COLUMNS = [
  { key: 'articulo', label: 'Articulo' },
  { key: 'descripcion', label: 'Descripcion' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'localizador', label: 'Localizador' },
  { key: 'lpnContenido', label: 'Contenedor (LPN)' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

export function RecepcionTab({ movimientos }: RecepcionTabProps) {
  const recepcionMoves = useMemo(
    () => movimientos.filter(
      (m) => m.subinventario === 'RECEPCION' && m.tipoTransaccion.toLowerCase() === 'direct org transfer sin remito',
    ),
    [movimientos],
  );

  const totalUnidades = useMemo(
    () => recepcionMoves.reduce((sum, m) => sum + Math.abs(m.cantidad), 0),
    [recepcionMoves],
  );

  const contenedores = useMemo(() => {
    const lpnSet = new Set(
      recepcionMoves
        .filter((m) => m.lpnContenido && m.lpnContenido.trim() !== '')
        .map((m) => m.lpnContenido),
    );
    return lpnSet.size;
  }, [recepcionMoves]);

  // Breakdown by turno for the visual indicator
  const contenedoresByTurno = useMemo(() => {
    const turnoMap = new Map<string, Set<string>>();
    for (const m of recepcionMoves) {
      if (!m.lpnContenido || !m.lpnContenido.trim()) continue;
      const turno = m.turno || 'S/T';
      if (!turnoMap.has(turno)) turnoMap.set(turno, new Set());
      turnoMap.get(turno)!.add(m.lpnContenido);
    }
    return Array.from(turnoMap.entries())
      .map(([turno, lpns]) => ({ turno, cantidad: lpns.size }))
      .sort((a, b) => a.turno.localeCompare(b.turno));
  }, [recepcionMoves]);

  const tableData = useMemo(
    () =>
      recepcionMoves.map((m) => ({
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        localizador: m.localizador,
        lpnContenido: m.lpnContenido || '',
        usuario: m.usuario,
        turno: m.turno,
      })),
    [recepcionMoves],
  );

  if (!recepcionMoves.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <Boxes size={28} className="text-[var(--color-text-muted)] opacity-40" />
        <p className="text-sm text-[var(--color-text-muted)]">Sin movimientos de recepcion para esta fecha</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          Selecciona otra fecha para ver los datos de recepcion.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          label="Total Unidades Recibidas"
          value={totalUnidades.toLocaleString()}
          unit="unidades"
        />
        {/* Enhanced contenedores card with mini chart */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">
                Contenedores Ingresados
              </span>
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                {contenedores.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--color-accent-green)]/10">
              <Package size={18} className="text-[var(--color-accent-green)]" />
            </div>
          </div>
          {contenedoresByTurno.length > 0 && (
            <div className="mt-1">
              <p className="text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
                Por turno
              </p>
              <ResponsiveContainer width="100%" height={40}>
                <BarChart data={contenedoresByTurno} layout="horizontal" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="turno" hide />
                  <YAxis hide />
                  <Bar dataKey="cantidad" fill="var(--color-accent-green)" radius={[2, 2, 0, 0]} barSize={16}>
                    <LabelList dataKey="cantidad" position="top" style={{ fill: 'var(--color-text-muted)', fontSize: 9 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-0.5">
                {contenedoresByTurno.map((t) => (
                  <span key={t.turno} className="text-[10px] text-[var(--color-text-muted)]">
                    {t.turno}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Detalle de Recepcion
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={COLUMNS}
          searchKeys={['articulo', 'descripcion', 'usuario', 'lpnContenido']}
          emptyMessage="No se encontraron movimientos de recepcion."
        />
      </div>
    </div>
  );
}
