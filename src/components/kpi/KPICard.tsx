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
      className="relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-2 min-w-0 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-black/20"
      style={accentColor ? { borderTopColor: accentColor, borderTopWidth: '2px' } : undefined}
    >
      {/* Label + subtitle stacked (avoids collision on narrow cards) */}
      <div className="flex flex-col gap-1 min-w-0">
        <span
          className="text-[var(--color-text-muted)] uppercase font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: 'clamp(0.55rem, 0.9vw, 0.7rem)', letterSpacing: '0.02em' }}
          title={label}
        >
          {label}
        </span>
        {subtitle && (
          <span
            className="self-start text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap max-w-full truncate"
            style={{
              backgroundColor: accentColor ? `color-mix(in srgb, ${accentColor} 15%, transparent)` : 'var(--color-border)',
              color: accentColor ?? 'var(--color-text-muted)',
            }}
            title={subtitle}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Value — nunca se corta; auto-ajusta tamaño en contenedores estrechos */}
      <span
        className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] tabular-nums leading-tight whitespace-nowrap block"
        style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.75rem)' }}
        title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
      >
        {value}
        {unit && <span className="text-sm ml-1 font-medium text-[var(--color-text-muted)]">{unit}</span>}
      </span>

      {/* Trend */}
      {trend && trendValue && (
        <span className={`flex items-center gap-1 text-[11px] font-medium min-w-0 ${trendColor}`}>
          <TrendIcon size={11} className="flex-shrink-0" />
          <span className="truncate" title={trendValue}>{trendValue}</span>
        </span>
      )}
    </div>
  );
}

/** Skeleton placeholder for loading state */
export function KPICardSkeleton() {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-3 animate-pulse">
      <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
      <div className="h-8 w-24 rounded bg-[var(--color-border)]" />
      <div className="h-3 w-32 rounded bg-[var(--color-border)]" />
    </div>
  );
}
