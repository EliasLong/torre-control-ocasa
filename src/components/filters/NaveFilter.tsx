'use client';
import { Nave } from '@/types';
interface Props { value: Nave; onChange: (v: Nave) => void; }
export function NaveFilter({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Nave)}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm"
    >
      <option value="todas">Todas las naves</option>
      <option value="PL2">PL2</option>
      <option value="PL3">PL3</option>
    </select>
  );
}
