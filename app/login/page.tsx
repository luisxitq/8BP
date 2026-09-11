'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
      {/* ambient red glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,0,25,0.25),_transparent_55%)]" />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 opacity-40"
        style={{
          backgroundImage: 'url(/crow.svg)',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'bottom center',
          backgroundSize: '80px auto',
        }}
      />

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full ie-logo-ring mb-4 border border-red-900/50 bg-black/40 p-2">
            <Image src="/logo.svg" alt="ItachiEngine" width={80} height={80} priority />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            <span className="text-white">Itachi</span>
            <span className="text-red-500">Engine</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">License Admin Panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="ie-card rounded-2xl p-5 sm:p-6 backdrop-blur"
        >
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
