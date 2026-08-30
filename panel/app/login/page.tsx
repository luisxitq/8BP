'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Login failed'); return; }
      router.push('/dashboard');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0f12 0%,#17171f 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: '#312e81' }}>
            <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">KZ License Panel</h1>
          <p className="text-sm mt-1" style={{ color: '#9898b0' }}>Sign in to manage license keys</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5" style={{ background: '#17171f', border: '1px solid #2a2a3a' }}>
          {error && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#2d1515', border: '1px solid #5c2020', color: '#f87171' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9898b0' }}>Username</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              required autoFocus
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', color: '#e2e2ea' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#9898b0' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
              style={{ background: '#1e1e2a', border: '1px solid #2a2a3a', color: '#e2e2ea' }}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-all"
            style={{ background: loading ? '#312e81' : '#6366f1', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
