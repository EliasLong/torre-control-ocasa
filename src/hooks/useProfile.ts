/**
 * Compatibility shim for SGP2 components that use useProfile().
 * Maps useAuth() to the profile shape expected by those components.
 */
'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import type { AppUser } from '@/types'

interface Profile {
    id: string
    full_name: string
    email: string
    role: AppUser['role']
}

export function useProfile() {
    const { user } = useAuth()

    const profile: Profile | null = user
        ? {
            id: user.id,
            full_name: user.name,
            email: user.email,
            role: user.role,
        }
        : null

    return { profile, clearProfile: () => {} }
}
