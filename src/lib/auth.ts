/**
 * Client-side auth helpers.
 * Actual session is now stored in an httpOnly JWT cookie managed by
 * the /api/auth/* routes.  These helpers are kept for compatibility
 * with components that import them directly.
 */
import type { AppUser, TabPermission } from '@/types';

export const ALL_TABS: TabPermission[] = [
    'operacional',
    'indicadores-diarios',
    'financiero',
    'merma',
    'abc-xyz',
    'torre-control',
    'reportes',
    'tracking',
    'estado-del-turno',
    'incidencias',
];

export function canAccessTab(user: AppUser | null, tab: TabPermission): boolean {
    if (!user) return false;
    if (user.role === 'superadmin') return true;
    if (user.status !== 'approved') return false;
    return user.tabs.includes(tab);
}

export function isAdmin(user: AppUser | null): boolean {
    if (!user) return false;
    return user.role === 'superadmin' || user.role === 'admin';
}

// Legacy stubs — actual logic lives in /api/auth/* and auth-server.ts
export function register() { return { ok: false, error: 'Use /api/auth/register' }; }
export function login() { return { ok: false, user: undefined, error: 'Use /api/auth/login' }; }
export function logout() { /* handled by AuthProvider */ }
export function getCurrentUser(): AppUser | null { return null; }
export function getAllUsers(): AppUser[] { return []; }
export function updateUserStatus() {}
export function updateUserRole() {}
export function updateUserTabs() {}
