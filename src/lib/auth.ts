import type { AppUser, TabPermission, UserRole } from '@/types';

const LS_USERS_KEY = 'auth_users';
const LS_SESSION_KEY = 'auth_session';

const ALL_TABS: TabPermission[] = ['operacional', 'financiero', 'merma', 'abc-xyz', 'torre-control', 'reportes'];

// Super admin seed — always exists
const SUPER_ADMIN: AppUser = {
  id: 'superadmin-001',
  email: 'admin@ocasa.com',
  name: 'Administrador',
  password: 'admin123',
  role: 'superadmin',
  status: 'approved',
  tabs: ALL_TABS,
  createdAt: '2026-01-01',
};

function getUsers(): AppUser[] {
  if (typeof window === 'undefined') return [SUPER_ADMIN];
  try {
    const raw = localStorage.getItem(LS_USERS_KEY);
    if (!raw) return [SUPER_ADMIN];
    const users = JSON.parse(raw) as AppUser[];
    // Ensure superadmin always exists
    if (!users.find(u => u.id === SUPER_ADMIN.id)) {
      users.unshift(SUPER_ADMIN);
    }
    return users;
  } catch {
    return [SUPER_ADMIN];
  }
}

function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
  } catch {
    // silent
  }
}

export function register(email: string, name: string, password: string): { ok: boolean; error?: string } {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'El email ya está registrado' };
  }

  const newUser: AppUser = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    name,
    password,
    role: 'viewer',
    status: 'pending',
    tabs: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };

  users.push(newUser);
  saveUsers(users);
  return { ok: true };
}

export function login(email: string, password: string): { ok: boolean; user?: AppUser; error?: string } {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) return { ok: false, error: 'Usuario no encontrado' };
  if (user.password !== password) return { ok: false, error: 'Contraseña incorrecta' };
  if (user.status === 'pending') return { ok: false, error: 'Tu cuenta está pendiente de aprobación' };
  if (user.status === 'rejected') return { ok: false, error: 'Tu cuenta fue rechazada. Contacta al administrador' };

  // Save session
  try {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify({ userId: user.id }));
  } catch {
    // silent
  }

  return { ok: true, user };
}

export function logout(): void {
  try {
    localStorage.removeItem(LS_SESSION_KEY);
  } catch {
    // silent
  }
}

export function getCurrentUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { userId: string };
    const users = getUsers();
    return users.find(u => u.id === session.userId) ?? null;
  } catch {
    return null;
  }
}

export function getAllUsers(): AppUser[] {
  return getUsers();
}

export function updateUserStatus(userId: string, status: 'approved' | 'rejected'): void {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role === 'superadmin') return;
  user.status = status;
  // Auto-grant all tabs on approve if none set
  if (status === 'approved' && user.tabs.length === 0) {
    user.tabs = [...ALL_TABS];
  }
  saveUsers(users);
}

export function updateUserRole(userId: string, role: UserRole): void {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role === 'superadmin') return;
  user.role = role;
  saveUsers(users);
}

export function updateUserTabs(userId: string, tabs: TabPermission[]): void {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.role === 'superadmin') return;
  user.tabs = tabs;
  saveUsers(users);
}

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

export { ALL_TABS };
