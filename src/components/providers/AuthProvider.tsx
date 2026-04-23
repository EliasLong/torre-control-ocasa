'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppUser } from '@/types';
import { isAdmin, canAccessTab } from '@/lib/auth';

interface AuthContextValue {
    user: AppUser | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    register: (email: string, name: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>({
        id: 'mock-user-id',
        email: 'admin@ocasa.com',
        name: 'Admin Global',
        role: 'superadmin',
        status: 'approved',
        tabs: [],
        createdAt: new Date().toISOString()
    });
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        // LOGIN TEMPORALMENTE DESACTIVADO
        // try {
        //     const res = await fetch('/api/auth/me');
        //     if (res.ok) {
        //         const data = await res.json();
        //         setUser(data);
        //     } else {
        //         setUser(null);
        //     }
        // } catch {
        //     setUser(null);
        // }
    }, []);

    useEffect(() => {
        refresh().finally(() => setLoading(false));
    }, [refresh]);

    const login = useCallback(async (email: string, password: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? 'Error al iniciar sesión' };
        setUser(data);
        return { ok: true };
    }, []);

    const register = useCallback(async (email: string, name: string, password: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? 'Error al registrarse' };
        return { ok: true };
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

// Re-export helpers so existing consumers work unchanged
export { isAdmin, canAccessTab };
