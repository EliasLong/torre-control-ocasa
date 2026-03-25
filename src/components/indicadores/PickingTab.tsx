'use client';

import { useMemo } from 'react';
import { FamiliaDonut } from './FamiliaDonut';
import { TurnoChart } from './TurnoChart';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw, TurnoBreakdown } from '@/types';

interface PickingTabProps {
  movimientos: MovimientoRaw[];
  turno: TurnoBreakdown[];
}

const COLUMNS = [
  { key: 'articulo', label: 'Artículo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'subinventario', label: 'Subinventario' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

export function PickingTab({ movimientos, turno }: PickingTabProps) {
  const pickMoves = useMemo(
    () => movimientos.filter((m) => m.tipoTransaccion.includes('Sales Order Pick')),
    [movimientos],
  );

  const tableData = useMemo(
    () =>
      pickMoves.map((m) => ({
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        subinventario: m.subinventario,
        usuario: m.usuario,
        turno: m.turno,
      })),
    [pickMoves],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Distribución por Familia
          </h3>
          <FamiliaDonut movimientos={movimientos} />
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Picking por Turno
          </h3>
          <TurnoChart data={turno} />
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Detalle de Picking
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={COLUMNS}
          searchKeys={['articulo', 'descripcion', 'usuario']}
        />
      </div>
    </div>
  );
}
