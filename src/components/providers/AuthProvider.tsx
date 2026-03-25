'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppUser } from '@/types';
import { getCurrentUser, login as authLogin, logout as authLogout, register as authRegister } from '@/lib/auth';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (email: string, name: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
  }, [refresh]);

  const login = useCallback((email: string, password: string) => {
    const result = authLogin(email, password);
    if (result.ok && result.user) {
      setUser(result.user);
    }
    return { ok: result.ok, error: result.error };
  }, []);

  const register = useCallback((email: string, name: string, password: string) => {
    return authRegister(email, name, password);
  }, []);

  const logout = useCallback(() => {
    authLogout();
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
