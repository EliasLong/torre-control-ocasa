'use client';

import { DateRange } from '@/types';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[var(--color-text-muted)]">Desde</label>
      <input
        type="date"
        value={value.from}
        min="2026-01-01"
        onChange={e => onChange({ ...value, from: e.target.value })}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm"
      />
      <label className="text-sm text-[var(--color-text-muted)]">Hasta</label>
      <input
        type="date"
        value={value.to}
        min="2026-01-01"
        onChange={e => onChange({ ...value, to: e.target.value })}
        className="bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm"
      />
    </div>
  );
}
