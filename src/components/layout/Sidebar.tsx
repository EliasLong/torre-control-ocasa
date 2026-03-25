'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarDays, DollarSign, TrendingDown, Grid3X3, Settings, Activity, LogOut, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { canAccessTab, isAdmin } from '@/lib/auth';
import type { TabPermission } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: typeof BarChart3;
  tab: TabPermission;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/operacional', label: 'Operacional', icon: BarChart3, tab: 'operacional' },
  { href: '/indicadores-diarios', label: 'Indicadores Diarios', icon: CalendarDays, tab: 'indicadores-diarios' },
  { href: '/financiero', label: 'Financiero', icon: DollarSign, tab: 'financiero' },
  { href: '/merma', label: 'Merma', icon: TrendingDown, tab: 'merma' },
  { href: '/abc-xyz', label: 'ABC-XYZ', icon: Grid3X3, tab: 'abc-xyz' },
  { href: '/torre-control', label: 'Torre de Control', icon: Activity, tab: 'torre-control' },
  { href: '/reportes', label: 'Reportes', icon: FileSpreadsheet, tab: 'reportes' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item => canAccessTab(user, item.tab));
  const showAdmin = isAdmin(user);

  return (
    <aside className="w-64 h-screen bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex flex-col p-4 gap-2">
      <div className="flex items-center gap-3 mb-6 px-3">
        <Image src="/logo_ocasa.png" alt="OCASA" width={140} height={40} priority />
      </div>

      {visibleItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            pathname.startsWith(href)
              ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Icon size={18} />
          <span className="text-sm font-medium">{label}</span>
        </Link>
      ))}

      <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex flex-col gap-1">
        {showAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname.startsWith('/admin')
                ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Settings size={18} />
            <span className="text-sm font-medium">Admin</span>
          </Link>
        )}

        {user && (
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)] truncate max-w-[140px]" title={user.email}>
              {user.name}
            </span>
            <button
              onClick={logout}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
