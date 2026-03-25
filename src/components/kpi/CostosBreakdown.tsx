import { formatCurrency } from '@/lib/calculations';

interface Props {
  fijos: number;
  variables: number;
}

export function CostosBreakdown({ fijos, variables }: Props) {
  const total = fijos + variables;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">Costos Fijos</span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {formatCurrency(fijos)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">Costos Variables</span>
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          {formatCurrency(variables)}
        </span>
      </div>
      <div className="border-t border-[var(--color-border)] pt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total</span>
        <span className="text-sm font-bold text-[var(--color-accent-red)]">
          {formatCurrency(total)}
        </span>
      </div>
      {/* Proportional bar */}
      <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--color-bg-surface)] mt-1">
        <div
          className="h-full bg-[var(--color-accent-amber)]"
          style={{ width: total > 0 ? `${(fijos / total) * 100}%` : '0%' }}
        />
      </div>
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>Fijos: {total > 0 ? ((fijos / total) * 100).toFixed(1) : 0}%</span>
        <span>Variables: {total > 0 ? ((variables / total) * 100).toFixed(1) : 0}%</span>
      </div>
    </div>
  );
}
