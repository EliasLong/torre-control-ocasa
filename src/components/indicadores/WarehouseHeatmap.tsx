'use client'

import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import {
    PL2_LAYOUT, PL3_LAYOUT,
    PL2_SECTION_LABELS, PL3_SECTION_LABELS,
    PL2_ROW_LABELS, PL3_ROW_LABELS,
} from '@/lib/ocupacion-layout'
import type { Planta, SectorData } from '@/types/ocupacion'

function getColor(pct: number): string {
    if (pct >= 100) return 'var(--color-accent-red)'
    if (pct >= 75) return 'var(--color-accent-amber)'
    if (pct >= 50) return 'var(--color-accent-cyan)'
    return 'var(--color-accent-green)'
}

interface CellProps {
    id: string
    data: SectorData | undefined
}

function Cell({ id, data }: CellProps) {
    const [hovered, setHovered] = useState(false)

    if (!data) {
        return (
            <div
                className="rounded-lg flex items-center justify-center border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]"
                style={{ minHeight: 68 }}
            >
                <span className="text-[9px] font-medium opacity-30 text-[var(--color-text-muted)]">{id}</span>
            </div>
        )
    }

    const color = getColor(data.pct)
    const fillH = Math.min(data.pct, 100)
    const over = data.pct > 100

    return (
        <div
            className="relative rounded-lg cursor-default select-none bg-[var(--color-bg-primary)]"
            style={{ border: `1px solid ${color}40`, minHeight: 68 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                <div
                    className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ${over ? 'animate-pulse' : ''}`}
                    style={{ height: `${fillH}%`, background: color, opacity: 0.22 }}
                />
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: color }} />
            </div>

            <div className="relative p-1.5 flex flex-col justify-between h-full" style={{ minHeight: 68 }}>
                <span className="text-[9px] font-semibold leading-none text-[var(--color-text-muted)]">{id}</span>
                <div>
                    <p className="text-[13px] font-bold leading-none tabular-nums" style={{ color }}>
                        {data.pct.toFixed(1)}%
                    </p>
                    <p className="text-[8px] mt-0.5 tabular-nums text-[var(--color-text-muted)]">
                        {data.pallets} plt
                    </p>
                </div>
            </div>

            {hovered && (
                <div
                    className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap pointer-events-none shadow-xl bg-[var(--color-bg-card)] text-[var(--color-text-primary)]"
                    style={{ border: `1px solid ${color}60` }}
                >
                    <p className="font-bold mb-1" style={{ color }}>{id}</p>
                    <p>Pallets: <strong>{data.pallets}</strong></p>
                    <p>m² ocupados: <strong>{data.m2Ocupados.toFixed(1)}</strong></p>
                    <p>Capacidad: <strong>{data.capM2} m²</strong></p>
                    <p>Ocupación: <strong style={{ color }}>{data.pct.toFixed(1)}%</strong></p>
                    {data.pct > 100 && (
                        <p className="mt-1 font-semibold text-[var(--color-accent-red)]">⚠ Desborde de capacidad</p>
                    )}
                </div>
            )}
        </div>
    )
}

interface RowProps {
    sections: string[][]
    sectores: Record<string, SectorData>
    sectionLabels: string[]
}

function Row({ sections, sectores, sectionLabels }: RowProps) {
    return (
        <div className="flex gap-2">
            {sections.map((section, si) => (
                <div key={si} className="flex gap-1.5 flex-1">
                    <div
                        className="flex items-center justify-center w-5 flex-shrink-0 rounded text-[9px] font-bold opacity-60 bg-[var(--color-border)] text-[var(--color-text-muted)]"
                        style={{ writingMode: 'vertical-rl', letterSpacing: '0.1em' }}
                    >
                        {sectionLabels[si]}
                    </div>
                    {section.map(id => (
                        <div key={id} className="flex-1" style={{ minWidth: 0 }}>
                            <Cell id={id} data={sectores[id]} />
                        </div>
                    ))}
                    {si < sections.length - 1 && (
                        <div className="w-3 flex-shrink-0 rounded flex items-center justify-center bg-[var(--color-bg-surface)]">
                            <span
                                className="text-[7px] font-medium opacity-40 text-[var(--color-text-muted)]"
                                style={{ writingMode: 'vertical-rl' }}
                            >
                                PASILLO
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function Legend() {
    const items = [
        { label: '< 50%', color: 'var(--color-accent-green)' },
        { label: '50 – 75%', color: 'var(--color-accent-cyan)' },
        { label: '75 – 100%', color: 'var(--color-accent-amber)' },
        { label: '> 100%', color: 'var(--color-accent-red)' },
    ]
    return (
        <div className="flex flex-wrap items-center gap-4">
            {items.map(({ label, color }) => (
                <div key={label} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.7 }} />
                    <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
                </div>
            ))}
            <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[var(--color-border)]" />
                <span className="text-[11px] text-[var(--color-text-muted)]">Sin datos</span>
            </div>
        </div>
    )
}

interface WarehouseHeatmapProps {
    planta: Planta
    sectores: Record<string, SectorData>
}

export function WarehouseHeatmap({ planta, sectores }: WarehouseHeatmapProps) {
    const layout = planta === 'pl2' ? PL2_LAYOUT : PL3_LAYOUT
    const sectionLabels = planta === 'pl2' ? PL2_SECTION_LABELS : PL3_SECTION_LABELS
    const rowLabels = planta === 'pl2' ? PL2_ROW_LABELS : PL3_ROW_LABELS

    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <LayoutGrid size={15} className="text-[var(--color-text-muted)]" />
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Mapa de Ocupación — {planta.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="flex gap-2">
                <div className="flex flex-col gap-2 justify-around flex-shrink-0">
                    {rowLabels.map(lbl => (
                        <div
                            key={lbl}
                            className="text-[9px] font-semibold uppercase tracking-widest text-right opacity-50 text-[var(--color-text-muted)]"
                            style={{ minWidth: 36 }}
                        >
                            {lbl}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {layout.map((sections, ri) => (
                        <Row key={ri} sections={sections} sectores={sectores} sectionLabels={sectionLabels} />
                    ))}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                <Legend />
            </div>
        </div>
    )
}
