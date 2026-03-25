'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Completá todos los campos');
      return;
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    const result = register(email, name, password);
    if (!result.ok) {
      setError(result.error ?? 'Error al registrarse');
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-sm text-center">
          <CheckCircle2 size={48} className="mx-auto text-[var(--color-accent-green)] mb-4" />
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Registro exitoso</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">
            Tu cuenta está pendiente de aprobación por un administrador. Te avisaremos cuando esté lista.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[var(--color-accent-cyan)] text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-sm bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 shadow-sm">
        <div className="flex justify-center mb-8">
          <Image src="/logo_ocasa.png" alt="OCASA" width={160} height={46} priority />
        </div>

        <h1 className="text-xl font-bold text-[var(--color-text-primary)] text-center mb-6">
          Crear Cuenta
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-[var(--color-text-muted)] mb-1">Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]"
              placeholder="Juan Pérez"
            />
          </div>
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
            Registrarse
          </button>
        </form>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-[var(--color-accent-cyan)] hover:underline">
            Iniciar Sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
