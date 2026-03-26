import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIData } from '@/types';

const accentMap = {
  cyan: 'var(--color-accent-cyan)',
  green: 'var(--color-accent-green)',
  amber: 'var(--color-accent-amber)',
  red: 'var(--color-accent-red)',
} as const;

export function KPICard({ label, value, unit, trend, trendValue, accent, subtitle }: KPIData) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-[var(--color-accent-green)]'
      : trend === 'down'
        ? 'text-[var(--color-accent-red)]'
        : 'text-[var(--color-text-muted)]';

  const accentColor = accent ? accentMap[accent] : undefined;

  return (
    <div
      className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-2 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/20"
      style={accentColor ? { borderTopColor: accentColor, borderTopWidth: '2px' } : undefined}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
          {label}
        </span>
        {subtitle && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: accentColor ? `color-mix(in srgb, ${accentColor} 15%, transparent)` : 'var(--color-border)',
              color: accentColor ?? 'var(--color-text-muted)',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Value */}
      <span className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums leading-tight">
        {value}
        {unit && <span className="text-sm ml-1 font-medium text-[var(--color-text-muted)]">{unit}</span>}
      </span>

      {/* Trend */}
      {trend && trendValue && (
        <span className={`flex items-center gap-1.5 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={12} />
          {trendValue}
        </span>
      )}
    </div>
  );
}

/** Skeleton placeholder for loading state */
export function KPICardSkeleton() {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
      <div className="h-8 w-24 rounded bg-[var(--color-border)]" />
      <div className="h-3 w-32 rounded bg-[var(--color-border)]" />
    </div>
  );
}
