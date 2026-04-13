'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Plus, X, RefreshCcw, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

const PRIORIDAD_COLORS = {
    baja: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    media: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    alta: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    critica: 'bg-red-500/10 text-red-600 border-red-500/20',
}

const ESTADO_COLORS = {
    abierta: 'bg-red-500/10 text-red-600 border-red-500/20',
    en_progreso: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    resuelta: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    cerrada: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
}

const ESTADO_LABELS = { abierta: 'Abierta', en_progreso: 'En Progreso', resuelta: 'Resuelta', cerrada: 'Cerrada' }
const PRIORIDAD_LABELS = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Incidencia = Record<string, any>

export default function IncidenciasPage() {
    const { user } = useAuth()
    const [incidencias, setIncidencias] = useState<Incidencia[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [filterEstado, setFilterEstado] = useState<string>('all')
    const [filterPrioridad, setFilterPrioridad] = useState<string>('all')
    const [form, setForm] = useState({ warehouse: 'PL2', titulo: '', descripcion: '', tipo: 'operacional', prioridad: 'media' })

    const isAdmin = user?.role === 'superadmin' || user?.role === 'admin'

    const fetch_ = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/incidencias')
            if (res.ok) setIncidencias(await res.json())
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => { fetch_() }, [fetch_])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await fetch('/api/incidencias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        })
        if (res.ok) {
            setShowForm(false)
            setForm({ warehouse: 'PL2', titulo: '', descripcion: '', tipo: 'operacional', prioridad: 'media' })
            fetch_()
        }
    }

    const handleEstadoChange = async (id: string, estado: string) => {
        await fetch('/api/incidencias', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, estado }),
        })
        fetch_()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminás esta incidencia?')) return
        await fetch('/api/incidencias', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        fetch_()
    }

    const filtered = incidencias.filter(inc => {
        if (filterEstado !== 'all' && inc.estado !== filterEstado) return false
        if (filterPrioridad !== 'all' && inc.prioridad !== filterPrioridad) return false
        return true
    })

    const openCount = incidencias.filter(i => i.estado === 'abierta' || i.estado === 'en_progreso').length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle size={24} className="text-[var(--color-accent-amber)]" />
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Incidencias</h1>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {openCount > 0 ? `${openCount} incidencias activas` : 'Sin incidencias activas'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetch_} className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg transition-colors">
                        <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--color-accent-cyan)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} /> Nueva Incidencia
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)] font-medium">Estado:</span>
                    <div className="flex gap-1">
                        {['all', 'abierta', 'en_progreso', 'resuelta', 'cerrada'].map(e => (
                            <button key={e}
                                onClick={() => setFilterEstado(e)}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                                    filterEstado === e
                                        ? 'bg-[var(--color-accent-cyan)] text-white'
                                        : 'bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                }`}
                            >
                                {e === 'all' ? 'Todas' : ESTADO_LABELS[e as keyof typeof ESTADO_LABELS]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)] font-medium">Prioridad:</span>
                    <div className="flex gap-1">
                        {['all', 'baja', 'media', 'alta', 'critica'].map(p => (
                            <button key={p}
                                onClick={() => setFilterPrioridad(p)}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                                    filterPrioridad === p
                                        ? 'bg-[var(--color-accent-cyan)] text-white'
                                        : 'bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                }`}
                            >
                                {p === 'all' ? 'Todas' : PRIORIDAD_LABELS[p as keyof typeof PRIORIDAD_LABELS]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* New incidencia form */}
            {showForm && (
                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">Nueva Incidencia</h3>
                        <button onClick={() => setShowForm(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                            <X size={18} />
                        </button>
                    </div>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Depósito</label>
                            <select value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}
                                className="w-full text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)]">
                                <option value="PL2">PL2</option>
                                <option value="PL3">PL3</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Prioridad</label>
                            <select value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                                className="w-full text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)]">
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Título *</label>
                            <input required value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                                className="w-full text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)]"
                                placeholder="Describí el problema brevemente" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Descripción</label>
                            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                rows={3}
                                className="w-full text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] resize-none"
                                placeholder="Detalle adicional..." />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                Cancelar
                            </button>
                            <button type="submit"
                                className="px-4 py-2 text-sm font-semibold bg-[var(--color-accent-cyan)] text-white rounded-lg hover:opacity-90">
                                Crear Incidencia
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--color-accent-cyan)]" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <CheckCircle2 size={40} className="text-[var(--color-accent-green)] mb-3 opacity-50" />
                    <p className="text-[var(--color-text-muted)]">No hay incidencias con los filtros seleccionados.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(inc => (
                        <div key={inc.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORIDAD_COLORS[inc.prioridad as keyof typeof PRIORIDAD_COLORS] ?? ''}`}>
                                            {PRIORIDAD_LABELS[inc.prioridad as keyof typeof PRIORIDAD_LABELS] ?? inc.prioridad}
                                        </span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                                            {inc.warehouse}
                                        </span>
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(inc.created_at).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-[var(--color-text-primary)]">{inc.titulo}</h4>
                                    {inc.descripcion && (
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">{inc.descripcion}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <select
                                        value={inc.estado}
                                        onChange={e => handleEstadoChange(inc.id, e.target.value)}
                                        className={`text-xs font-semibold px-2 py-1 rounded-full border ${ESTADO_COLORS[inc.estado as keyof typeof ESTADO_COLORS] ?? ''} bg-transparent`}
                                    >
                                        <option value="abierta">Abierta</option>
                                        <option value="en_progreso">En Progreso</option>
                                        <option value="resuelta">Resuelta</option>
                                        <option value="cerrada">Cerrada</option>
                                    </select>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(inc.id)}
                                            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
