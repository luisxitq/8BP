'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/** Logo inline — no depende de /public (siempre se ve) */
function ItachiLogo({ className = 'w-20 h-20' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="ItachiEngine">
      <defs>
        <radialGradient id="ieGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ff2a2a" />
          <stop offset="55%" stopColor="#9b0000" />
          <stop offset="100%" stopColor="#1a0000" />
        </radialGradient>
      </defs>
      <circle cx="64" cy="64" r="60" fill="#0a0a0a" stroke="#5c0000" strokeWidth="2" />
      <circle cx="64" cy="64" r="42" fill="url(#ieGlow)" opacity="0.95" />
      <circle cx="64" cy="64" r="28" fill="none" stroke="#ff4d4d" strokeWidth="2" opacity="0.7" />
      <circle cx="64" cy="64" r="14" fill="#1a0000" stroke="#ff1a1a" strokeWidth="2" />
      <circle cx="64" cy="64" r="5" fill="#ff2a2a" />
      <path d="M64 22c18 6 28 20 28 36" stroke="#ff6666" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M98 78c-10 16-26 26-42 26" stroke="#ff6666" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
      <path d="M40 90c-12-14-14-32-6-46" stroke="#ff6666" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,0,25,0.28),_transparent_55%)]" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center rounded-full ie-logo-ring mb-4 border border-red-900/60 bg-black/50 p-2">
            <ItachiLogo className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-white">Itachi</span>
            <span className="text-red-500">Engine</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">License Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="ie-card rounded-2xl p-5 sm:p-6 backdrop-blur">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <label className="block text-sm text-zinc-400 mb-1.5">Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="ie-input w-full mb-4 px-3 py-3 sm:py-2.5 rounded-xl bg-black/50 border border-zinc-800 transition"
            autoComplete="username"
            inputMode="text"
            required
          />

          <label className="block text-sm text-zinc-400 mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ie-input w-full mb-6 px-3 py-3 sm:py-2.5 rounded-xl bg-black/50 border border-zinc-800 transition"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loading} className="ie-btn-primary w-full py-3 sm:py-2.5 rounded-xl touch-manipulation">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[11px] text-zinc-600 mt-5">ItachiEngine · 8 Ball Pool</p>
      </div>
    </div>
  );
}
