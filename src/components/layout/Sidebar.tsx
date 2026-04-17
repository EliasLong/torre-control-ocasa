'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    BarChart3, CalendarDays, DollarSign, TrendingDown, Grid3X3, Settings,
    LogOut, FileSpreadsheet, Truck, AlertTriangle, Wrench, ChevronDown,
    ExternalLink, Package, ClipboardList
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { canAccessTab, isAdmin } from '@/lib/auth';
import type { TabPermission } from '@/types';

type IconT = typeof BarChart3;

interface NavItem {
    href: string;
    label: string;
    icon: IconT;
    tab: TabPermission;
}

interface ToolItem {
    label: string;
    icon: IconT;
    href: string;
    external?: boolean;
    tab?: TabPermission;
}

const NAV_ITEMS: NavItem[] = [
    { href: '/operacional', label: 'Operacional', icon: BarChart3, tab: 'operacional' },
    { href: '/indicadores-diarios', label: 'Indicadores Diarios', icon: CalendarDays, tab: 'indicadores-diarios' },
    { href: '/financiero', label: 'Financiero', icon: DollarSign, tab: 'financiero' },
    { href: '/merma', label: 'Merma', icon: TrendingDown, tab: 'merma' },
    { href: '/abc-xyz', label: 'ABC-XYZ', icon: Grid3X3, tab: 'abc-xyz' },
    { href: '/reportes', label: 'Reportes', icon: FileSpreadsheet, tab: 'reportes' },
    { href: '/tracking', label: 'Tracking', icon: Truck, tab: 'tracking' },
];

const TOOL_ITEMS: ToolItem[] = [
    { label: 'Incidencias', icon: AlertTriangle, href: '/herramientas/incidencias', tab: 'incidencias' },
    { label: 'Dock Manager', icon: Package, href: 'https://dock-manager-ocasa-pilar.up.railway.app/operador', external: true },
    { label: 'Inventario', icon: ClipboardList, href: 'https://inventario-app-umber.vercel.app', external: true },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [toolsOpen, setToolsOpen] = useState(pathname.startsWith('/herramientas'));

    const visibleItems = NAV_ITEMS.filter(item => canAccessTab(user, item.tab));
    const visibleTools = TOOL_ITEMS.filter(t => !t.tab || canAccessTab(user, t.tab));
    const showAdmin = isAdmin(user);

    const toolsActive = pathname.startsWith('/herramientas');

    return (
        <aside className="w-64 h-screen bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex flex-col p-4 gap-1">
            <div className="flex items-center gap-3 mb-6 px-3">
                <Image src="/logo_ocasa.png" alt="OCASA" width={140} height={40} priority />
            </div>

            {visibleItems.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname.startsWith(href)
                        ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
                        : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
                        }`}
                >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{label}</span>
                </Link>
            ))}

            {visibleTools.length > 0 && (
                <div className="flex flex-col">
                    <button
                        onClick={() => setToolsOpen(v => !v)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full ${toolsActive
                            ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Wrench size={18} />
                        <span className="text-sm font-medium flex-1 text-left">Herramientas</span>
                        <ChevronDown size={14} className={`transition-transform ${toolsOpen ? 'rotate-0' : '-rotate-90'}`} />
                    </button>

                    {toolsOpen && (
                        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-3">
                            {visibleTools.map(({ label, icon: Icon, href, external }) => {
                                const active = !external && pathname.startsWith(href);
                                const className = `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active
                                    ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
                                    }`;

                                return external ? (
                                    <a
                                        key={href}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={className}
                                    >
                                        <Icon size={15} />
                                        <span className="flex-1">{label}</span>
                                        <ExternalLink size={11} className="opacity-60" />
                                    </a>
                                ) : (
                                    <Link key={href} href={href} className={className}>
                                        <Icon size={15} />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex flex-col gap-1">
                {showAdmin && (
                    <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname.startsWith('/admin')
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
                            onClick={() => logout()}
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
