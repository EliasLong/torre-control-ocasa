'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertCircle, Package, Clock, AlertTriangle } from 'lucide-react'
import type { Warehouse } from '@/types/tracking'

const SHEET_PEDIDOS = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'
const GID: Record<string, number> = { PL2: 0, PL3: 1150456694 }

interface PedidoRow {
    nroPedido: string
    vendedor: string
    vtoPedido: string
    transporte: string
    articulo: string
    tamano: string
    descripcion: string
    cantidad: string
}

type SemaforoStatus = 'verde' | 'amarillo' | 'rojo'

const MESES: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
}

function parseVtoDate(dateStr: string): Date {
    if (!dateStr) return new Date()
    // "9 abr 2026"
    const parts = dateStr.toLowerCase().trim().split(' ')
    if (parts.length >= 3) {
        const day = parseInt(parts[0])
        const month = MESES[parts[1]] ?? 0
        const year = parseInt(parts[2])
        if (!isNaN(day) && !isNaN(year)) return new Date(year, month, day)
    }
    // "DD/MM/YYYY" o "YYYY-MM-DD"
    if (dateStr.includes('/') || dateStr.includes('-')) {
        const sep = dateStr.includes('/') ? '/' : '-'
        const p = dateStr.split(sep).map(Number)
        if (p.length === 3) {
            if (p[2] > 1000) return new Date(p[2], p[1] - 1, p[0])
            if (p[0] > 1000) return new Date(p[0], p[1] - 1, p[2])
        }
    }
    return new Date(dateStr)
}

function getSemaforo(vtoStr: string): SemaforoStatus {
    if (!vtoStr) return 'verde'
    const vto = parseVtoDate(vtoStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    vto.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((today.getTime() - vto.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'verde'
    if (diffDays <= 2) return 'amarillo'
    return 'rojo'
}

const SEMAFORO_COLORS: Record<SemaforoStatus, string> = {
    verde: 'var(--color-accent-green)',
    amarillo: 'var(--color-accent-amber)',
    rojo: 'var(--color-accent-red)',
}

const SEMAFORO_LABEL: Record<SemaforoStatus, string> = {
    verde: 'Al día',
    amarillo: '24-48h',
    rojo: '> 48h',
}

interface Props {
    warehouse: Warehouse
}

export function PedidosPendientes({ warehouse }: Props) {
    const [data, setData] = useState<PedidoRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            else setRefreshing(true)
            setError(null)

            const gid = GID[warehouse] ?? 0
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_PEDIDOS}/gviz/tq?tqx=out:csv&gid=${gid}&_t=${Date.now()}`
            const res = await fetch(url)
            if (!res.ok) throw new Error('Error al conectar con Google Sheets')

            const csv = await res.text()
            const rows = csv.split('\n').filter(r => r.trim())
            if (rows.length < 2) { setData([]); return }

            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''))
            const parsed = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
                const obj: Record<string, string> = {}
                headers.forEach((h, i) => { obj[h] = values[i] || '' })

                const tamanoKey = warehouse === 'PL2' ? 'Tamaño PL2' : 'Tamaño PL3'
                return {
                    nroPedido: obj['Nro Pedido'] || '',
                    vendedor: obj['Nombre Cliente'] || obj['Vendedor'] || '',
                    vtoPedido: obj['Vto Pedido'] || obj['Vto pedido'] || obj['Vto OC'] || '',
                    transporte: obj['Transporte'] || 'S/A',
                    articulo: obj['Articulo'] || '',
                    tamano: obj[tamanoKey] || '',
                    descripcion: obj['Descripción Articulo'] || obj['Descripción'] || '',
                    cantidad: obj['Cantidad'] || '0',
                } as PedidoRow
            })

            const filtered = parsed.filter(r => {
                const t = r.transporte.trim().toUpperCase()
                return t !== 'FLOTA PROPIA CON COORDINACION' && t !== 'S/A'
            })

            setData(filtered)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [warehouse])

    useEffect(() => {
        fetchData()
        const interval = setInterval(() => fetchData(true), 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [fetchData])

    const vencidosCount = data.filter(r => getSemaforo(r.vtoPedido) !== 'verde').length
    const semaforoCounts = { verde: 0, amarillo: 0, rojo: 0 }
    data.forEach(r => { semaforoCounts[getSemaforo(r.vtoPedido)]++ })
    const total = data.length || 1

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-[var(--color-accent-cyan)] opacity-30" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30">
                <AlertCircle size={16} className="text-[var(--color-accent-red)]" />
                <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5">
            {/* Header + refresh */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Pedidos Pendientes — {warehouse}
                </h3>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] transition-colors text-[var(--color-text-muted)]"
                    title="Actualizar datos"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* KPIs row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* Pedidos Totales */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-1"
                     style={{ borderTopColor: 'var(--color-accent-cyan)', borderTopWidth: 2 }}>
                    <div className="flex items-center gap-1.5">
                        <Package size={12} className="text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Totales</span>
                    </div>
                    <span className="text-3xl font-bold text-[var(--color-text-primary)] tabular-nums">{data.length}</span>
                </div>

                {/* Pedidos Vencidos */}
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col gap-1"
                     style={{ borderTopColor: 'var(--color-accent-red)', borderTopWidth: 2 }}>
                    <div className="flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Vencidos</span>
                    </div>
                    <span className="text-3xl font-bold text-[var(--color-accent-red)] tabular-nums">{vencidosCount}</span>
                </div>

                {/* Semáforo barras */}
                <div className="sm:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                        <Clock size={12} className="text-[var(--color-text-muted)]" />
                        <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Vencimiento</span>
                    </div>
                    <div className="flex h-5 rounded-full overflow-hidden">
                        {(['verde', 'amarillo', 'rojo'] as SemaforoStatus[]).map(s => {
                            const pct = (semaforoCounts[s] / total) * 100
                            if (pct === 0) return null
                            return (
                                <div
                                    key={s}
                                    className="h-full transition-all duration-500"
                                    style={{ width: `${pct}%`, background: SEMAFORO_COLORS[s] }}
                                    title={`${SEMAFORO_LABEL[s]}: ${semaforoCounts[s]} (${pct.toFixed(0)}%)`}
                                />
                            )
                        })}
                    </div>
                    <div className="flex gap-4 mt-2">
                        {(['verde', 'amarillo', 'rojo'] as SemaforoStatus[]).map(s => (
                            <div key={s} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEMAFORO_COLORS[s] }} />
                                <span className="text-[10px] text-[var(--color-text-muted)]">
                                    {SEMAFORO_LABEL[s]}: {semaforoCounts[s]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                                {['', 'Nro Pedido', 'Vendedor', 'Vto', 'Transporte', 'Artículo', 'Tamaño', 'Descripción', 'Cant.'].map(h => (
                                    <th key={h} className="px-3 py-3 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {data.map((row, idx) => {
                                const semaforo = getSemaforo(row.vtoPedido)
                                return (
                                    <tr key={idx} className="hover:bg-[var(--color-bg-surface)] transition-colors">
                                        <td className="px-3 py-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEMAFORO_COLORS[semaforo] }} />
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-[var(--color-text-primary)] whitespace-nowrap">{row.nroPedido}</td>
                                        <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{row.vendedor}</td>
                                        <td className="px-3 py-2.5 text-[var(--color-text-muted)] whitespace-nowrap">{row.vtoPedido}</td>
                                        <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{row.transporte}</td>
                                        <td className="px-3 py-2.5 text-[var(--color-text-muted)] font-mono text-xs">{row.articulo}</td>
                                        <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{row.tamano}</td>
                                        <td className="px-3 py-2.5 text-[var(--color-text-muted)] text-xs max-w-[200px] truncate">{row.descripcion}</td>
                                        <td className="px-3 py-2.5 text-center font-bold text-[var(--color-text-primary)] tabular-nums">{row.cantidad}</td>
                                    </tr>
                                )
                            })}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                                        No hay pedidos pendientes
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
