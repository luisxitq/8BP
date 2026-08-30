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

const btnBase =
  'px-2.5 py-1.5 rounded-lg text-xs font-medium transition touch-manipulation disabled:opacity-40 active:scale-95';

function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, banned: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editLic, setEditLic] = useState<License | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [customKey, setCustomKey] = useState('');
  const [maxDevices, setMaxDevices] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');

  // edit form
  const [editKey, setEditKey] = useState('');
  const [editMaxDevices, setEditMaxDevices] = useState(1);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'expired' | 'banned'>('active');

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
          game_type: '8ball',
          max_devices: maxDevices,
          note: '',
          expires_at: expiresAt || null,
          features: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creating key');
      setShowCreate(false);
      setCustomKey('');
      setExpiresAt('');
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

  function openEdit(lic: License) {
    setEditLic(lic);
    setEditKey(lic.key);
    setEditMaxDevices(lic.max_devices ?? 1);
    setEditExpiresAt(lic.expires_at ? lic.expires_at.slice(0, 10) : '');
    setEditStatus(lic.status);
  }

  async function saveEdit() {
    if (!editLic) return;
    setBusy(editLic.id);
    try {
      const res = await fetch(`/api/licenses/${encodeURIComponent(editLic.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edit: true,
          key: editKey.trim(),
          max_devices: editMaxDevices,
          expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al editar');
      setEditLic(null);
      await load();
    } catch (e) {
      alert(String(e));
    } finally {
      setBusy(null);
    }
  }

  async function copyKey(key: string, id: string) {
    try {
      await navigator.clipboard.writeText(key);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = key;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function KeyWithCopy({ lic }: { lic: License }) {
    const isCopied = copiedId === lic.id;
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-sm text-emerald-400 truncate">{lic.key}</span>
        <button
          type="button"
          onClick={() => copyKey(lic.key, lic.id)}
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition touch-manipulation ${
            isCopied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
          }`}
          title="Copiar key"
        >
          {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
          <span className="hidden xs:inline sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    );
  }

  function Actions({ lic }: { lic: License }) {
    const id = lic.id;
    return (
      <div className="flex flex-wrap gap-1.5">
        {lic.status !== 'active' && (
          <button
            disabled={busy === id}
            onClick={() => patch(id, { status: 'active' })}
            className={`${btnBase} bg-emerald-600/20 text-emerald-400`}
          >
            Activate
          </button>
        )}
        {lic.status !== 'banned' && (
          <button
            disabled={busy === id}
            onClick={() => patch(id, { status: 'banned' })}
            className={`${btnBase} bg-red-600/20 text-red-400`}
          >
            Ban
          </button>
        )}
        <button
          disabled={busy === id}
          onClick={() => patch(id, { reset_hwid: true })}
          className={`${btnBase} bg-zinc-700 text-zinc-300`}
        >
          Reset HWID
        </button>
        <button
          disabled={busy === id}
          onClick={() => {
            const d = prompt('Días a extender:', '30');
            if (d) patch(id, { extend_days: Number(d) });
          }}
          className={`${btnBase} bg-zinc-700 text-zinc-300`}
        >
          +Days
        </button>
        <button
          disabled={busy === id}
          onClick={() => openEdit(lic)}
          className={`${btnBase} bg-sky-600/20 text-sky-400`}
        >
          Edit
        </button>
        <button
          disabled={busy === id}
          onClick={() => remove(id)}
          className={`${btnBase} bg-red-900/40 text-red-400`}
        >
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-950 pb-8">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-emerald-400">8BP</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold leading-tight text-sm sm:text-base truncate">License Panel</h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">Firebase · Aim Engine</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition touch-manipulation"
            >
              + Create Key
            </button>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition touch-manipulation"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-400 transition touch-manipulation"
            >
              Logout
            </button>
          </div>

          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => setShowCreate(true)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-xs font-medium touch-manipulation"
            >
              + Key
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-2 rounded-lg bg-zinc-800 touch-manipulation"
              aria-label="Menú"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-zinc-800 px-3 py-2 flex gap-2 bg-zinc-900">
            <button
              onClick={() => {
                load();
                setMenuOpen(false);
              }}
              className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-sm touch-manipulation"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-sm text-red-400 touch-manipulation"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-zinc-100' },
            { label: 'Active', value: stats.active, color: 'text-emerald-400' },
            { label: 'Expired', value: stats.expired, color: 'text-amber-400' },
            { label: 'Banned', value: stats.banned, color: 'text-red-400' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 sm:px-4 sm:py-3"
            >
              <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl sm:text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm break-words">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center text-zinc-500 py-12">Cargando…</p>
        ) : licenses.length === 0 ? (
          <div className="text-center py-12 sm:py-16 border border-dashed border-zinc-800 rounded-2xl px-4">
            <p className="text-zinc-500 mb-3">No hay keys todavía</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 active:bg-emerald-700 text-sm font-medium touch-manipulation"
            >
              Crear primera key
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {licenses.map((lic) => (
                <div key={lic.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <KeyWithCopy lic={lic} />
                    <span
                      className={`shrink-0 inline-block px-2 py-0.5 rounded-md border text-[10px] font-medium uppercase ${STATUS_STYLE[lic.status] || ''}`}
                    >
                      {lic.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-zinc-400 mb-3">
                    <div>
                      <span className="text-zinc-600">Expires</span>
                      <p className="text-zinc-300">
                        {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : 'Lifetime'}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-600">Devices</span>
                      <p className="text-zinc-300">{lic.max_devices || '∞'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-600">HWID</span>
                      <p className="font-mono text-[11px] text-zinc-300 break-all">{lic.hwid || '—'}</p>
                    </div>
                  </div>

                  <Actions lic={lic} />
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-zinc-400 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Key</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">HWID</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Devices</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="bg-zinc-950/50 hover:bg-zinc-900/40">
                      <td className="px-4 py-3">
                        <KeyWithCopy lic={lic} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${STATUS_STYLE[lic.status] || ''}`}
                        >
                          {lic.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400 max-w-[140px] truncate">
                        {lic.hwid || '—'}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {lic.expires_at
                          ? new Date(lic.expires_at).toLocaleDateString()
                          : 'Lifetime'}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {lic.max_devices || '∞'}
                      </td>
                      <td className="px-4 py-3">
                        <Actions lic={lic} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-700 border-b-0 sm:border-b bg-zinc-900 p-5 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4 sm:hidden" />
            <h2 className="text-lg font-semibold mb-4">Nueva License Key</h2>

            <label className="block text-xs text-zinc-400 mb-1">Key (vacío = auto)</label>
            <input
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="LYN8BP-XXXX-XXXX"
              className="w-full mb-3 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm font-mono"
            />

            <label className="block text-xs text-zinc-400 mb-1">Max devices (0 = unlimited)</label>
            <input
              type="number"
              min={0}
              value={maxDevices}
              onChange={(e) => setMaxDevices(Number(e.target.value))}
              className="w-full mb-3 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <label className="block text-xs text-zinc-400 mb-1">Expires (vacío = lifetime)</label>
            <input
              type="date"
              value={expiresAt ? expiresAt.slice(0, 10) : ''}
              onChange={(e) =>
                setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')
              }
              className="w-full mb-5 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <div className="flex gap-2 justify-end sticky bottom-0 bg-zinc-900 pt-1 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg bg-zinc-800 text-sm touch-manipulation"
              >
                Cancelar
              </button>
              <button
                disabled={busy === 'create'}
                onClick={createKey}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg bg-emerald-600 text-sm font-medium disabled:opacity-50 touch-manipulation"
              >
                {busy === 'create' ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editLic && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-700 border-b-0 sm:border-b bg-zinc-900 p-5 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4 sm:hidden" />
            <h2 className="text-lg font-semibold mb-4">Editar License Key</h2>

            <label className="block text-xs text-zinc-400 mb-1">Key</label>
            <input
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              className="w-full mb-3 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm font-mono"
            />

            <label className="block text-xs text-zinc-400 mb-1">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as 'active' | 'expired' | 'banned')}
              className="w-full mb-3 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            >
              <option value="active">active</option>
              <option value="expired">expired</option>
              <option value="banned">banned</option>
            </select>

            <label className="block text-xs text-zinc-400 mb-1">Max devices (0 = unlimited)</label>
            <input
              type="number"
              min={0}
              value={editMaxDevices}
              onChange={(e) => setEditMaxDevices(Number(e.target.value))}
              className="w-full mb-3 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <label className="block text-xs text-zinc-400 mb-1">Expires (vacío = lifetime)</label>
            <input
              type="date"
              value={editExpiresAt}
              onChange={(e) => setEditExpiresAt(e.target.value)}
              className="w-full mb-5 px-3 py-3 sm:py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm"
            />

            <div className="flex gap-2 justify-end sticky bottom-0 bg-zinc-900 pt-1 pb-[env(safe-area-inset-bottom)]">
              <button
                onClick={() => setEditLic(null)}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg bg-zinc-800 text-sm touch-manipulation"
              >
                Cancelar
              </button>
              <button
                disabled={busy === editLic.id || !editKey.trim()}
                onClick={saveEdit}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg bg-sky-600 text-sm font-medium disabled:opacity-50 touch-manipulation"
              >
                {busy === editLic.id ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
