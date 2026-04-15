'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { AlertTriangle } from 'lucide-react'
import { KPICard, KPICardSkeleton } from '@/components/kpi/KPICard'
import { WarehouseHeatmap } from './WarehouseHeatmap'
import type { OcupacionData, Planta } from '@/types/ocupacion'

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Error fetching ocupación')
    return res.json() as Promise<OcupacionData>
})

function PlantaTabs({ planta, onChange }: { planta: Planta; onChange: (p: Planta) => void }) {
    return (
        <div className="flex rounded-lg overflow-hidden p-0.5 bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
            {(['pl2', 'pl3'] as Planta[]).map(p => {
                const active = p === planta
                return (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${active
                            ? 'bg-[var(--color-accent-cyan)] text-white'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        {p.toUpperCase()}
                    </button>
                )
            })}
        </div>
    )
}

export function OcupacionTab() {
    const [planta, setPlanta] = useState<Planta>('pl2')
    const { data, error, isLoading } = useSWR<OcupacionData>(
        `/api/ocupacion?planta=${planta}`,
        fetcher,
        { revalidateOnFocus: false, keepPreviousData: true }
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                    Ocupación del Depósito
                </h2>
                <PlantaTabs planta={planta} onChange={setPlanta} />
            </div>

            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30">
                    <AlertTriangle size={16} className="text-[var(--color-accent-red)] flex-shrink-0" />
                    <p className="text-sm text-[var(--color-accent-red)]">
                        No pudimos cargar los datos de ocupación. Verificá el sheet o la API key.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {isLoading || !data ? (
                    <>
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                        <KPICardSkeleton />
                    </>
                ) : (
                    <>
                        <KPICard
                            label="Ocupación global"
                            value={data.kpis.ocupacionGlobal.toFixed(1)}
                            unit="%"
                            accent="cyan"
                            subtitle={planta.toUpperCase()}
                        />
                        <KPICard
                            label="Pallets ocupados"
                            value={data.kpis.palletsOcupados.toLocaleString('es-AR')}
                            accent="green"
                        />
                        <KPICard
                            label="m² ocupados"
                            value={data.kpis.m2Ocupados.toLocaleString('es-AR')}
                            unit="m²"
                            accent="amber"
                        />
                        <KPICard
                            label="Sectores críticos"
                            value={data.kpis.sectoresCriticos}
                            accent="red"
                            subtitle="≥ 90%"
                        />
                    </>
                )}
            </div>

            {data && <WarehouseHeatmap planta={planta} sectores={data.sectores} />}
        </div>
    )
}
