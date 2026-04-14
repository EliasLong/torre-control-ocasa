'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Warehouse, FileText } from 'lucide-react'

const OPTIONS = [
    { id: 'PL2', name: 'PL2', description: 'Depósito Pilar 2', icon: Warehouse },
    { id: 'PL3', name: 'PL3', description: 'Depósito Pilar 3', icon: Warehouse },
    { id: 'estado-del-turno', name: 'Estado del Turno', description: 'Notas de pase de turno', icon: FileText },
] as const

export default function TrackingPage() {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        try {
            const last = localStorage.getItem('tracking_last_warehouse')
            if (last === 'pl2' || last === 'pl3') {
                router.replace(`/tracking/${last}`)
            } else {
                setIsChecking(false)
            }
        } catch {
            setIsChecking(false)
        }
    }, [router])

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-accent-cyan)]" />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Tracking</h1>
                <p className="text-[var(--color-text-muted)]">Seleccioná el módulo para gestionar los viajes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => router.push(`/tracking/${opt.id.toLowerCase()}`)}
                        className="flex flex-col items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-left
                                   shadow-sm transition-all duration-200
                                   hover:border-[var(--color-accent-cyan)]/50 hover:shadow-lg hover:scale-[1.02]"
                    >
                        <div className="rounded-full bg-[var(--color-accent-cyan)]/10 p-4">
                            <opt.icon className="h-8 w-8 text-[var(--color-accent-cyan)]" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{opt.name}</h2>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">{opt.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
