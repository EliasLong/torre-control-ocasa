import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—'
    try {
        if (dateStr.includes('-') && !dateStr.includes('T')) {
            const parts = dateStr.split('-')
            if (parts.length === 3 && parts[0].length === 4) {
                dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
            }
        }
        const normalized = dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`
        const date = new Date(normalized)
        if (isNaN(date.getTime())) return dateStr
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
        return dateStr
    }
}
