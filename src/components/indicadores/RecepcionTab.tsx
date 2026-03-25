'use client';

import { useMemo } from 'react';
import { KPICard } from '@/components/kpi/KPICard';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';

interface RecepcionTabProps {
  movimientos: MovimientoRaw[];
}

const COLUMNS = [
  { key: 'articulo', label: 'Artículo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'lpnContenido', label: 'LPN Contenido' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

export function RecepcionTab({ movimientos }: RecepcionTabProps) {
  const recepcionMoves = useMemo(
    () => movimientos.filter((m) => m.tipoTransaccion.includes('Direct Org Transfer')),
    [movimientos],
  );

  const totalUnidades = useMemo(
    () => recepcionMoves.reduce((sum, m) => sum + Math.abs(m.cantidad), 0),
    [recepcionMoves],
  );

  const totalLPNs = useMemo(() => {
    const lpnSet = new Set(
      recepcionMoves
        .filter((m) => m.lpnContenido && m.lpnContenido.trim() !== '')
        .map((m) => m.lpnContenido),
    );
    return lpnSet.size;
  }, [recepcionMoves]);

  const tableData = useMemo(
    () =>
      recepcionMoves.map((m) => ({
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        lpnContenido: m.lpnContenido || '',
        usuario: m.usuario,
        turno: m.turno,
      })),
    [recepcionMoves],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          label="Total Unidades Recibidas"
          value={totalUnidades.toLocaleString()}
          unit="unidades"
        />
        <KPICard
          label="LPNs Únicos"
          value={totalLPNs.toLocaleString()}
        />
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Detalle de Recepción
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={COLUMNS}
          searchKeys={['articulo', 'descripcion', 'usuario', 'lpnContenido']}
        />
      </div>
    </div>
  );
}
