'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/components/providers/AuthProvider';

const PUBLIC_PATHS = ['/login', '/register'];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPage) {
      router.replace('/login');
    }
    if (user && isPublicPage) {
      router.replace('/operacional');
    }
  }, [user, loading, isPublicPage, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="text-[var(--color-text-muted)]">Cargando...</div>
      </div>
    );
  }

  // Public pages (login/register) render without sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Not logged in — will redirect via useEffect
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-bg-primary)]">
        {children}
      </main>
    </div>
  );
}
