'use client';

import { useMemo } from 'react';
import { IndicadoresTable } from './IndicadoresTable';
import type { MovimientoRaw } from '@/types';

interface PortonesTabProps {
  movimientos: MovimientoRaw[];
}

const COLUMNS = [
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

  const pl2Moves = useMemo(
    () =>
      portonesMoves
        .filter((m) => m.org === 'PL2')
        .map((m) => ({
          articulo: m.articulo,
          descripcion: m.descripcion,
          cantidad: Math.abs(m.cantidad),
          lpnTransferido: m.lpnTransferido || '',
          usuario: m.usuario,
          turno: m.turno,
        })),
    [portonesMoves],
  );

  const pl3Moves = useMemo(
    () =>
      portonesMoves
        .filter((m) => m.org === 'PL3')
        .map((m) => ({
          articulo: m.articulo,
          descripcion: m.descripcion,
          cantidad: Math.abs(m.cantidad),
          lpnTransferido: m.lpnTransferido || '',
          usuario: m.usuario,
          turno: m.turno,
        })),
    [portonesMoves],
  );

  if (!portonesMoves.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-[var(--color-text-muted)]">
        Sin datos de portones para esta fecha
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          PL2 — Portones
        </h3>
        {pl2Moves.length > 0 ? (
          <IndicadoresTable
            data={pl2Moves}
            columns={COLUMNS}
            searchKeys={['articulo', 'descripcion', 'usuario']}
          />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Sin movimientos PL2</p>
        )}
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
          PL3 — Portones
        </h3>
        {pl3Moves.length > 0 ? (
          <IndicadoresTable
            data={pl3Moves}
            columns={COLUMNS}
            searchKeys={['articulo', 'descripcion', 'usuario']}
          />
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">Sin movimientos PL3</p>
        )}
      </div>
    </div>
  );
}
