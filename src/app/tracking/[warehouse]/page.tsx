'use client'

import { useParams } from 'next/navigation'
import { TrackingTabs } from '@/components/tracking/TrackingTabs'
import { useTrackingTrips } from '@/hooks/useTrackingTrips'
import type { Warehouse } from '@/types/tracking'

const VALID_WAREHOUSES = ['pl2', 'pl3'] as const

export default function WarehouseTrackingPage() {
    const params = useParams()
    const warehouseParam = params.warehouse as string

    if (!VALID_WAREHOUSES.includes(warehouseParam as typeof VALID_WAREHOUSES[number])) {
        // Handle unknown routes (e.g. estado-del-turno - redirect to its own page)
        return null
    }

    const warehouse = warehouseParam.toUpperCase() as Warehouse
    return <WarehouseContent warehouse={warehouse} />
}

function WarehouseContent({ warehouse }: { warehouse: Warehouse }) {
    const { b2cTrips, b2bTrips, isLoading, fetchTrips, saveTrip, saveTripsBatch, deleteTrip } = useTrackingTrips(warehouse)

    if (isLoading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-accent-cyan)]" />
            </div>
        )
    }

    return (
        <TrackingTabs
            warehouse={warehouse}
            b2cTrips={b2cTrips}
            b2bTrips={b2bTrips}
            onSave={saveTrip}
            onSaveBatch={saveTripsBatch}
            onDelete={deleteTrip}
            onRefresh={fetchTrips}
        />
    )
}
