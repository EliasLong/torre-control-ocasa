'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function usePedidosIngresados() {
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sync = useCallback(async () => {
    try {
      // POST syncs the sheet → DB and returns the new total
      const res = await fetch('/api/evento/pedidos-ingresados', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.total === 'number') {
        setTotal(data.total);
        setLastSync(new Date());
      }
    } catch {
      // silently fail — don't disrupt the main dashboard
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial sync on mount
    sync();
    // Poll every 5 minutes
    timerRef.current = setInterval(sync, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sync]);

  return { total, loading, lastSync, sync };
}
