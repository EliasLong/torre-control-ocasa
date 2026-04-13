'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Completá todos los campos');
      return;
    }

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.error ?? 'Error al iniciar sesión');
      return;
    }

    router.push('/operacional');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo_ocasa.png" alt="OCASA" width={160} height={46} priority />
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-6">
          Iniciar Sesión
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-accent-red)]">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-accent-cyan)] text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Ingresar
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="text-[var(--color-accent-cyan)] hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
