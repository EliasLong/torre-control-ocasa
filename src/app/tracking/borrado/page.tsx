'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trash2, RefreshCcw, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { TRIP_STATUS_LABELS } from '@/types/tracking'

export default function BorradoPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deletedTrips, setDeletedTrips] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadDeleted = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/tracking?showDeleted=true')
            if (res.ok) setDeletedTrips(await res.json())
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { loadDeleted() }, [loadDeleted])

    const handlePermanentDelete = async (id: string) => {
        if (!confirm('¿Eliminás este registro PERMANENTEMENTE? Esta acción no se puede deshacer.')) return
        const res = await fetch(`/api/tracking?id=${id}&permanent=true`, { method: 'DELETE' })
        if (res.ok) { loadDeleted() } else {
            const err = await res.json()
            alert('Error: ' + (err.error || 'No se pudo eliminar'))
        }
    }

    const handleDeleteAll = async () => {
        if (!confirm('¿Eliminás TODOS los registros borrados PERMANENTEMENTE?')) return
        const res = await fetch('/api/tracking?id=all&permanent=true', { method: 'DELETE' })
        if (res.ok) { loadDeleted() } else {
            const err = await res.json()
            alert('Error: ' + (err.error || 'No se pudo vaciar'))
        }
    }

    const handleRestore = async (id: string) => {
        const res = await fetch('/api/tracking', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'pending' }),
        })
        if (res.ok) { loadDeleted() } else { alert('Error al restaurar') }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/tracking" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Papelera de Reciclaje</h1>
                        <p className="text-sm text-[var(--color-text-muted)]">Viajes borrados pendientes de eliminación definitiva</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {deletedTrips.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--color-accent-red)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Trash2 size={14} /> Vaciar Papelera
                        </button>
                    )}
                    <button
                        onClick={loadDeleted}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
                    >
                        <RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} /> Actualizar
                    </button>
                </div>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-1">
                    <Trash2 size={18} className="text-[var(--color-text-muted)]" />
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Viajes en espera de eliminación definitiva</h3>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] mb-5">
                    Solo los administradores pueden realizar el borrado final.
                </p>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--color-accent-cyan)]" />
                    </div>
                ) : deletedTrips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[var(--color-border)] rounded-lg">
                        <AlertCircle size={32} className="text-[var(--color-text-muted)] mb-2 opacity-40" />
                        <p className="text-[var(--color-text-muted)]">No hay viajes en la papelera.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
                        <table className="w-full text-sm">
                            <thead className="bg-[var(--color-bg-surface)]">
                                <tr className="border-b border-[var(--color-border)]">
                                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Fecha</th>
                                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Transporte</th>
                                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Viaje</th>
                                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Cliente</th>
                                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Depósito</th>
                                    <th className="text-left px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Borrado el</th>
                                    <th className="text-right px-4 py-3 text-[var(--color-text-muted)] text-xs font-semibold uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {deletedTrips.map(trip => (
                                    <tr key={trip.id} className="hover:bg-[var(--color-bg-surface)] transition-colors">
                                        <td className="px-4 py-3 text-[var(--color-text-primary)]">{new Date(trip.date).toLocaleDateString('es-AR')}</td>
                                        <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{trip.carrier}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{trip.trip_number}</td>
                                        <td className="px-4 py-3 text-[var(--color-text-muted)]">{trip.client || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                                                {trip.warehouse}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                                            {new Date(trip.updated_at).toLocaleString('es-AR')}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => handleRestore(trip.id)}
                                                className="text-xs font-medium text-[var(--color-accent-green)] hover:underline"
                                            >
                                                Restaurar
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDelete(trip.id)}
                                                className="text-xs font-medium text-[var(--color-accent-red)] hover:underline"
                                            >
                                                Eliminar definitivo
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
