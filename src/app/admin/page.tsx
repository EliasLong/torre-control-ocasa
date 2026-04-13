'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Users, FileText, DollarSign } from 'lucide-react';
import type { Tarifa, Costo, AppUser, TabPermission, UserRole } from '@/types';
import { tarifasMock, costosMock } from '@/lib/mock/financiero.mock';
import { TarifasTable } from '@/components/tables/TarifasTable';
import { CostosTable } from '@/components/tables/CostosTable';
import { ALL_TABS } from '@/lib/auth';

const LS_KEY_TARIFAS = 'admin_tarifas';
const LS_KEY_COSTOS = 'admin_costos';

type AdminTab = 'usuarios' | 'tarifas' | 'costos';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

const TAB_LABELS: Record<TabPermission, string> = {
  operacional: 'Operacional',
  financiero: 'Financiero',
  merma: 'Merma',
  'abc-xyz': 'ABC-XYZ',
  'torre-control': 'Torre de Control',
  reportes: 'Reportes',
  'indicadores-diarios': 'Indicadores Diarios',
  tracking: 'Tracking',
  'estado-del-turno': 'Estado del Turno',
  incidencias: 'Incidencias',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [costos, setCostos] = useState<Costo[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTarifas(loadFromStorage<Tarifa[]>(LS_KEY_TARIFAS, tarifasMock));
    setCostos(loadFromStorage<Costo[]>(LS_KEY_COSTOS, costosMock));
    setHydrated(true);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = useCallback(async (userId: string, status: 'approved' | 'rejected') => {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, status }),
    });
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId: string, role: UserRole) => {
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, role }),
    });
    fetchUsers();
  }, [fetchUsers]);

  const handleTabToggle = useCallback(async (userId: string, tab: TabPermission) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const next = user.tabs.includes(tab)
      ? user.tabs.filter(t => t !== tab)
      : [...user.tabs, tab];
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, tabs: next }),
    });
    fetchUsers();
  }, [users, fetchUsers]);

  const handleTarifasUpdate = (next: Tarifa[]) => {
    setTarifas(next);
    saveToStorage(LS_KEY_TARIFAS, next);
  };

  const handleCostosUpdate = (next: Costo[]) => {
    setCostos(next);
    saveToStorage(LS_KEY_COSTOS, next);
  };

  if (!hydrated) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)]">Cargando...</div>;
  }

  const tabs: { key: AdminTab; label: string; icon: typeof Users }[] = [
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'tarifas', label: 'Tarifas', icon: FileText },
    { key: 'costos', label: 'Costos', icon: DollarSign },
  ];

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-[var(--color-accent-cyan)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Administración</h1>
      </div>

      <div className="flex gap-1 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-[var(--color-accent-cyan)] text-white'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Icon size={16} />
            {label}
            {key === 'usuarios' && pendingCount > 0 && (
              <span className="bg-[var(--color-accent-red)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && (
        loadingUsers
          ? <div className="text-center py-12 text-[var(--color-text-muted)]">Cargando usuarios...</div>
          : <UsersPanel
              users={users}
              onStatusChange={handleStatusChange}
              onRoleChange={handleRoleChange}
              onTabToggle={handleTabToggle}
            />
      )}
      {activeTab === 'tarifas' && <TarifasTable tarifas={tarifas} onUpdate={handleTarifasUpdate} />}
      {activeTab === 'costos' && <CostosTable costos={costos} onUpdate={handleCostosUpdate} />}
    </div>
  );
}

function UsersPanel({
  users,
  onStatusChange,
  onRoleChange,
  onTabToggle,
}: {
  users: AppUser[];
  onStatusChange: (userId: string, status: 'approved' | 'rejected') => void;
  onRoleChange: (userId: string, role: UserRole) => void;
  onTabToggle: (userId: string, tab: TabPermission) => void;
}) {
  const pending = users.filter(u => u.status === 'pending');
  const active = users.filter(u => u.status === 'approved');
  const rejected = users.filter(u => u.status === 'rejected');

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-accent-amber)]/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-accent-amber)] uppercase tracking-wide mb-4">
            Pendientes de aprobación ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{user.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStatusChange(user.id, 'approved')}
                    className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent-green)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => onStatusChange(user.id, 'rejected')}
                    className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent-red)] text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wide mb-4">
          Usuarios activos ({active.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Nombre</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Email</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Rol</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Acceso a pestañas</th>
                <th className="text-left py-2 px-3 text-[var(--color-text-muted)] font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {active.map(user => (
                <tr key={user.id} className="border-b border-[var(--color-border)]/50">
                  <td className="py-3 px-3 text-[var(--color-text-primary)]">{user.name}</td>
                  <td className="py-3 px-3 text-[var(--color-text-muted)]">{user.email}</td>
                  <td className="py-3 px-3">
                    {user.role === 'superadmin' ? (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]">
                        Super Admin
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={e => onRoleChange(user.id, e.target.value as UserRole)}
                        className="text-xs bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-[var(--color-text-primary)]"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {user.role === 'superadmin' ? (
                      <span className="text-xs text-[var(--color-text-muted)]">Todas</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {ALL_TABS.map(tab => (
                          <button
                            key={tab}
                            onClick={() => onTabToggle(user.id, tab)}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                              user.tabs.includes(tab)
                                ? 'bg-[var(--color-accent-cyan)]/10 border-[var(--color-accent-cyan)]/30 text-[var(--color-accent-cyan)]'
                                : 'bg-[var(--color-bg-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                            }`}
                          >
                            {TAB_LABELS[tab]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {user.role !== 'superadmin' && (
                      <button
                        onClick={() => onStatusChange(user.id, 'rejected')}
                        className="text-xs text-[var(--color-accent-red)] hover:underline"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejected.length > 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-4">
            Usuarios desactivados ({rejected.length})
          </h3>
          <div className="space-y-2">
            {rejected.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text-muted)]">{user.name} — {user.email}</p>
                <button
                  onClick={() => onStatusChange(user.id, 'approved')}
                  className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-accent-green)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Reactivar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
