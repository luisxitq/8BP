'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-500/20 border border-red-500/30 mb-3 sm:mb-4">
            <span className="text-xl sm:text-2xl font-bold text-red-400">8BP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">License Panel</h1>
          <p className="text-zinc-400 text-sm mt-1">Itachi Engine · Admin</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur"
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
            className="w-full mb-4 px-3 py-3 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-red-500 transition"
            autoComplete="username"
            inputMode="text"
            required
          />

          <label className="block text-sm text-zinc-400 mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-3 py-3 sm:py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 focus:border-red-500 transition"
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 font-semibold transition touch-manipulation"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
