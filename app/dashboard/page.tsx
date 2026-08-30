'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface License {
  id: string;
  key: string;
  status: 'active' | 'expired' | 'banned';
  game_type: string;
  max_devices: number;
  note: string;
  created_at: string;
  expires_at: string | null;
  hwid: string;
  features: string;
  active_devices?: number;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  banned: number;
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  expired: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  banned: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function DashboardPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, banned: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Create form
  const [customKey, setCustomKey] = useState('');
  const [gameType, setGameType] = useState('8ball');
  const [maxDevices, setMaxDevices] = useState(1);
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [features, setFeatures] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/licenses');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setLicenses(data.licenses || []);
      setStats(data.stats || { total: 0, active: 0, expired: 0, banned: 0 });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function createKey() {
    setBusy('create');
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_key: customKey || undefined,
          game_type: gameType,
          max_devices: maxDevices,
          note,
          expires_at: expiresAt || null,
          features: features
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creating key');
      setShowCreate(false);
      setCustomKey('');
      setNote('');
      setExpiresAt('');
      setFeatures('');
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/licenses/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta key?')) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/licenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(null);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-400">8BP</span>
            </div>
            <div>
              <h1 className="font-semibold leading-tight">License Panel</h1>
              <p className="text-xs text-zinc-500">Firebase RTDB · Aim Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
            >
              + Create Key
            </button>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-400 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-zinc-100' },
            { label: 'Active', value: stats.active, color: 'text-emerald-400' },
            { label: 'Expired', value: stats.expired, color: 'text-amber-400' },
            { label: 'Banned', value: stats.banned, color: 'text-red-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
            >
              <p className="text-xs text-zinc-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-zinc-500 py-12">Cargando…</p>
        ) : licenses.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-500 mb-3">No hay keys todavía</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium"
            >
              Crear primera key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-400 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">HWID</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="bg-zinc-950/50 hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copy(lic.key)}
                        className="font-mono text-emerald-400 hover:underline"
                        title="Copiar"
                      >
                        {lic.key}
                      </button>
                      {lic.features && (
                        <p className="text-xs text-zinc-500 mt-0.5">{lic.features}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_STYLE[lic.status] || ''}`}
                      >
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 max-w-[120px] truncate">
                      {lic.hwid || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {lic.expires_at
                        ? new Date(lic.expires_at).toLocaleDateString()
                        : 'Lifetime'}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-[140px] truncate">
                      {lic.note || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lic.status !== 'active' && (
                          <button
                            disabled={busy === lic.id}
                            onClick={() => patch(lic.id, { status: 'active' })}
                            className="px-2 py-1 rounded bg-emerald-600/20 text-emerald-400 text-xs hover:bg-emerald-600/30"
                          >
                            Activate
                          </button>
                        )}
                        {lic.status !== 'banned' && (
                          <button
                            disabled={busy === lic.id}
                            onClick={() => patch(lic.id, { status: 'banned' })}
                            className="px-2 py-1 rounded bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30"
                          >
                            Ban
                          </button>
                        )}
                        <button
                          disabled={busy === lic.id}
                          onClick={() => patch(lic.id, { reset_hwid: true })}
                          className="px-2 py-1 rounded bg-zinc-700 text-zinc-300 text-xs hover:bg-zinc-600"
                        >
                          Reset HWID
                        </button>
                        <button
                          disabled={busy === lic.id}
                          onClick={() => {
                            const d = prompt('Días a extender:', '30');
                            if (d) patch(lic.id, { extend_days: Number(d) });
                          }}
                          className="px-2 py-1 rounded bg-zinc-700 text-zinc-300 text-xs hover:bg-zinc-600"
                        >
                          +Days
                        </button>
                        <button
                          disabled={busy === lic.id}
                          onClick={() => remove(lic.id)}
                          className="px-2 py-1 rounded bg-red-900/40 text-red-400 text-xs hover:bg-red-900/60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Nueva License Key</h2>

            <label className="block text-xs text-zinc-400 mb-1">Key (vacío = auto)</label>
            <input
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="LYN8BP-XXXX-XXXX"
              className="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm font-mono"
            />

            <label className="block text-xs text-zinc-400 mb-1">Game type</label>
            <input
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <label className="block text-xs text-zinc-400 mb-1">Max devices (0 = unlimited)</label>
            <input
              type="number"
              min={0}
              value={maxDevices}
              onChange={(e) => setMaxDevices(Number(e.target.value))}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <label className="block text-xs text-zinc-400 mb-1">Expires (vacío = lifetime)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <label className="block text-xs text-zinc-400 mb-1">Features (separadas por coma)</label>
            <input
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="aim,esp,speed"
              className="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <label className="block text-xs text-zinc-400 mb-1">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full mb-5 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={busy === 'create'}
                onClick={createKey}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium disabled:opacity-50"
              >
                {busy === 'create' ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
