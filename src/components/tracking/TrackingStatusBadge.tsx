import type { TripStatus } from '@/types/tracking'
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from '@/types/tracking'
import { cn } from '@/lib/tracking-utils'

export function TrackingStatusBadge({ status, className }: { status: TripStatus; className?: string }) {
    return (
        <span className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
            TRIP_STATUS_COLORS[status],
            className
        )}>
            {TRIP_STATUS_LABELS[status]}
        </span>
    )
}
