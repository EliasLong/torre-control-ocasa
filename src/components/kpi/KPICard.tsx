import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIData } from '@/types';

export function KPICard({ label, value, unit, trend, trendValue }: KPIData) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-[var(--color-accent-green)]' : trend === 'down' ? 'text-[var(--color-accent-red)]' : 'text-[var(--color-text-muted)]';
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-[var(--color-text-primary)]">{value}{unit && <span className="text-sm ml-1 text-[var(--color-text-muted)]">{unit}</span>}</span>
      {trend && <span className={`flex items-center gap-1 text-xs ${trendColor}`}><TrendIcon size={12}/>{trendValue}</span>}
    </div>
  );
}
