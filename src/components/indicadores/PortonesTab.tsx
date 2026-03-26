'use client';

import { useMemo } from 'react';
import { Truck } from 'lucide-react';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';

interface PortonesTabProps {
  movimientos: MovimientoRaw[];
}

const COLUMNS = [
  { key: 'org', label: 'Org' },
  { key: 'articulo', label: 'Artículo' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cantidad', label: 'Cantidad', align: 'right' as const },
  { key: 'lpnTransferido', label: 'LPN Transferido' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'turno', label: 'Turno' },
];

export function PortonesTab({ movimientos }: PortonesTabProps) {
  const portonesMoves = useMemo(
    () =>
      movimientos.filter(
        (m) => m.subTransferencia === 'PORTONES' || m.subinventario === 'PORTONES',
      ),
    [movimientos],
  );

  const allMoves = useMemo(
    () =>
      portonesMoves.map((m) => ({
        org: m.org || 'S/O',
        articulo: m.articulo,
        descripcion: m.descripcion,
        cantidad: Math.abs(m.cantidad),
        lpnTransferido: m.lpnTransferido || '',
        usuario: m.usuario,
        turno: m.turno,
      })),
    [portonesMoves],
  );

  // Summary counts for the header badges
  const orgCounts = useMemo(() => {
    const counts: Record<string, { rows: number; units: number }> = {};
    for (const m of allMoves) {
      if (!counts[m.org]) counts[m.org] = { rows: 0, units: 0 };
      counts[m.org].rows += 1;
      counts[m.org].units += m.cantidad;
    }
    return counts;
  }, [allMoves]);

  if (!portonesMoves.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <Truck size={28} className="text-[var(--color-text-muted)] opacity-40" />
        <p className="text-sm text-[var(--color-text-muted)]">Sin datos de portones para esta fecha</p>
        <p className="text-xs text-[var(--color-text-muted)] opacity-60">
          Los movimientos de portones (PL2/PL3) apareceran cuando haya despachos registrados.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(orgCounts).map(([org, { rows, units }]) => (
          <div
            key={org}
            className="flex items-center gap-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-2.5"
          >
            <span
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{
                background: org === 'PL2' ? 'var(--color-accent-cyan)' : 'var(--color-accent-amber)',
                color: 'var(--color-bg-primary)',
              }}
            >
              {org}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {units.toLocaleString()} uds
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {rows} movimientos
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          Portones -- Todos los movimientos
        </h3>
        <IndicadoresTable
          data={allMoves}
          columns={COLUMNS}
          searchKeys={['org', 'articulo', 'descripcion', 'usuario']}
          emptyMessage="No se encontraron movimientos de portones."
        />
      </div>
    </div>
  );
}
