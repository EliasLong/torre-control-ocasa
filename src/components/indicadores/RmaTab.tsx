'use client';

import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { KPICard } from '@/components/kpi/KPICard';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';

interface RmaTabProps {
  movimientos: MovimientoRaw[];
}

const COLUMNS = [
  { key: 'org', label: 'Org' },
  { key: 'articulo', label: 'Articulo' },
  { key: 'descripcion', label: 'Descripcion' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'localizador', label: 'Localizador' },
  { key: 'lpnContenido', label: 'Contenedor (LPN)' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

export function RmaTab({ movimientos }: RmaTabProps) {
  const rmaMoves = useMemo(
    () =>
      movimientos.filter(
        (m) =>
          m.subinventario === 'RECEPCION' &&
          m.tipoTransaccion.toLowerCase() === 'rma receipt',
      ),
    [movimientos],
  );

  const totalUnidades = useMemo(
    () => rmaMoves.reduce((sum, m) => sum + Math.abs(m.cantidad), 0),
    [rmaMoves],
  );

  const tableData = useMemo(
    () =>
      rmaMoves.map((m) => ({
        org: m.org,
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        localizador: m.localizador,
        lpnContenido: m.lpnContenido || '',
        usuario: m.usuario,
        turno: m.turno,
      })),
    [rmaMoves],
  );

  if (!rmaMoves.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <RotateCcw size={28} className="text-[var(--color-text-muted)] opacity-40" />
        <p className="text-sm text-[var(--color-text-muted)]">Sin movimientos RMA para esta fecha</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          Las devoluciones (RMA Receipt) apareceran cuando haya datos registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          label="Total Unidades RMA"
          value={totalUnidades.toLocaleString()}
          unit="unidades"
        />
        <KPICard
          label="Movimientos RMA"
          value={rmaMoves.length.toLocaleString()}
        />
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Detalle RMA Receipt
        </h3>
        <IndicadoresTable
          data={tableData}
          columns={COLUMNS}
          searchKeys={['org', 'articulo', 'descripcion', 'usuario', 'localizador']}
          emptyMessage="No se encontraron movimientos RMA."
        />
      </div>
    </div>
  );
}
