'use client';

import { useState } from 'react';
import { Trash2, Plus, Pencil, Save } from 'lucide-react';
import type { Tarifa } from '@/types';

interface TarifasTableProps {
  tarifas: Tarifa[];
  onUpdate: (tarifas: Tarifa[]) => void;
}

const EMPTY_TARIFA: Tarifa = {
  servicio: '',
  tarifa: 0,
  vigencia_desde: new Date().toISOString().slice(0, 10),
  vigencia_hasta: null,
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TarifasTable({ tarifas, onUpdate }: TarifasTableProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Tarifa>(EMPTY_TARIFA);

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setDraft({ ...tarifas[idx] });
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const next = tarifas.map((t, i) => (i === editingIdx ? { ...draft } : t));
    onUpdate(next);
    setEditingIdx(null);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
  };

  const addRow = () => {
    onUpdate([...tarifas, { ...EMPTY_TARIFA }]);
    setEditingIdx(tarifas.length);
    setDraft({ ...EMPTY_TARIFA });
  };

  const deleteRow = (idx: number) => {
    onUpdate(tarifas.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const updateDraft = (field: keyof Tarifa, value: string | number | null) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Tarifas</h2>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/20 transition-colors"
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
              <th className="text-left px-5 py-3 font-medium">Servicio</th>
              <th className="text-right px-5 py-3 font-medium">Tarifa ($)</th>
              <th className="text-left px-5 py-3 font-medium">Vigencia Desde</th>
              <th className="text-left px-5 py-3 font-medium">Vigencia Hasta</th>
              <th className="text-center px-5 py-3 font-medium w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarifas.map((tarifa, idx) => {
              const isEditing = editingIdx === idx;

              return (
                <tr
                  key={idx}
                  className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-card)]/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={draft.servicio}
                        onChange={(e) => updateDraft('servicio', e.target.value)}
                        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] text-sm outline-none focus:border-[var(--color-accent-cyan)]"
                      />
                    ) : (
                      <span className="text-[var(--color-text-primary)]">{tarifa.servicio}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.tarifa}
                        onChange={(e) => updateDraft('tarifa', Number(e.target.value))}
                        className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] text-sm text-right outline-none focus:border-[var(--color-accent-cyan)]"
                      />
                    ) : (
                      <span className="text-[var(--color-accent-green)] font-mono">
                        {formatCurrency(tarifa.tarifa)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <input
                        type="date"
                        value={draft.vigencia_desde}
                        onChange={(e) => updateDraft('vigencia_desde', e.target.value)}
                        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] text-sm outline-none focus:border-[var(--color-accent-cyan)]"
                      />
                    ) : (
                      <span className="text-[var(--color-text-muted)]">{tarifa.vigencia_desde}</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {isEditing ? (
                      <input
                        type="date"
                        value={draft.vigencia_hasta ?? ''}
                        onChange={(e) =>
                          updateDraft('vigencia_hasta', e.target.value || null)
                        }
                        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)] text-sm outline-none focus:border-[var(--color-accent-cyan)]"
                      />
                    ) : (
                      <span className="text-[var(--color-text-muted)]">
                        {tarifa.vigencia_hasta ?? '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="p-1.5 rounded hover:bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] transition-colors"
                            title="Guardar"
                          >
                            <Save size={15} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded hover:bg-[var(--color-accent-red)]/10 text-[var(--color-text-muted)] transition-colors"
                            title="Cancelar"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(idx)}
                            className="p-1.5 rounded hover:bg-[var(--color-accent-cyan)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)] transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteRow(idx)}
                            className="p-1.5 rounded hover:bg-[var(--color-accent-red)]/10 text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {tarifas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-[var(--color-text-muted)]">
                  No hay tarifas configuradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
