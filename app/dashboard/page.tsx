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
  devices?: string[];
  features: string;
  active_devices?: number;
}

interface Stats {
  total: number;
  active: number;
  expired: number;
  banned: number;
}

function shortId(hwid: string): string {
  if (hwid.length <= 10) return hwid;
  return hwid.slice(-8);
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Lifetime';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return iso.slice(0, 16);
  }
}

/** ISO → value for <input type="datetime-local"> */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

/** datetime-local value → ISO string */
function fromLocalInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function CopyIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function FingerprintIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.54 20a6 6 0 0 1-1.5-4.5 6 6 0 0 1 1.5-4" />
    </svg>
  );
}

function ChipIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
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
  const [note, setNote] = useState('');

  const [editKey, setEditKey] = useState('');
  const [editMaxDevices, setEditMaxDevices] = useState(1);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'expired' | 'banned'>('active');
  const [editNote, setEditNote] = useState('');

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
          note,
          expires_at: fromLocalInput(expiresAt),
          features: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creating key');
      setShowCreate(false);
      setCustomKey('');
      setExpiresAt('');
      setNote('');
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
    setEditExpiresAt(toLocalInput(lic.expires_at));
    setEditStatus(lic.status);
    setEditNote(lic.note || '');
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
          expires_at: fromLocalInput(editExpiresAt),
          status: editStatus,
          note: editNote,
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

  function statusBadge(status: string) {
    if (status === 'active') return 'bg-red-600/25 text-red-400 border-red-500/40';
    if (status === 'banned') return 'bg-red-600/25 text-red-400 border-red-500/40';
    return 'bg-amber-600/25 text-amber-400 border-amber-500/40';
  }

  function LicenseCard({ lic }: { lic: License }) {
    const devices = lic.devices?.length ? lic.devices : lic.hwid ? [lic.hwid] : [];
    const active = devices.length;
    const max = lic.max_devices > 0 ? lic.max_devices : '∞';
    const isBusy = busy === lic.id;

    return (
      <div className="rounded-2xl border border-zinc-800/80 bg-[#141416] p-4 sm:p-5 shadow-lg">
        <div className="flex items-start gap-3 mb-3">
          <div className="mt-0.5 text-sky-400 shrink-0">
            <FingerprintIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-[15px] sm:text-base text-white leading-snug break-all">
                {lic.key}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyKey(lic.key, lic.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition touch-manipulation"
                  title="Copy key"
                >
                  <CopyIcon className="w-4 h-4" />
                </button>
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide ${statusBadge(lic.status)}`}>
                  {lic.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 mb-3 pl-8">
          {lic.note ? (
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
              <span className="text-zinc-300">{lic.note}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <span>{formatDate(lic.expires_at || lic.created_at)}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
            <svg className="w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <path d="M11 18h2" />
            </svg>
            {active} / {max}
          </span>
          {copiedId === lic.id && <span className="text-red-400 text-[11px]">Copied!</span>}
        </div>

        {devices.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4 pl-0 sm:pl-8">
            {devices.map((d) => (
              <button
                key={d}
                type="button"
                disabled={isBusy}
                title={`${d} — click to remove`}
                onClick={async () => {
                  if (!confirm(`¿Quitar device ${shortId(d)}?`)) return;
                  setBusy(lic.id);
                  try {
                    const res = await fetch(
                      `/api/licenses/${encodeURIComponent(lic.id)}/device?hwid=${encodeURIComponent(d)}`,
                      { method: 'DELETE' }
                    );
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.error || res.statusText || 'Error');
                    await load();
                  } catch (e) {
                    alert(String(e));
                  } finally {
                    setBusy(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/80 text-[11px] font-mono text-sky-400 hover:border-red-500/50 hover:text-red-300 transition touch-manipulation"
              >
                <ChipIcon className="w-3 h-3 text-sky-500" />
                {shortId(d)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 mb-4 pl-0 sm:pl-8">Sin devices vinculados</p>
        )}

        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-800/80">
          <button
            disabled={isBusy}
            onClick={() => openEdit(lic)}
            className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 transition touch-manipulation disabled:opacity-40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit
          </button>
          {lic.status !== 'banned' ? (
            <button
              disabled={isBusy}
              onClick={() => patch(lic.id, { status: 'banned' })}
              className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/40 border border-amber-700/40 text-sm text-amber-400 transition touch-manipulation disabled:opacity-40"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M4.9 4.9l14.2 14.2" />
              </svg>
              Ban
            </button>
          ) : (
            <button
              disabled={isBusy}
              onClick={() => patch(lic.id, { status: 'active' })}
              className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-950/50 hover:bg-sky-900/40 border border-sky-700/40 text-sm text-sky-400 transition touch-manipulation disabled:opacity-40"
            >
              Activate
            </button>
          )}
          <button
            disabled={isBusy}
            onClick={() => remove(lic.id)}
            className="flex-1 min-w-[90px] inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-800/40 text-sm text-red-400 transition touch-manipulation disabled:opacity-40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
            Delete
          </button>
        </div>

        {devices.length > 0 && (
          <button
            disabled={isBusy}
            onClick={() => {
              if (confirm('¿Resetear todos los HWID de esta key?')) {
                patch(lic.id, { reset_hwid: true });
              }
            }}
            className="mt-2 w-full py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition touch-manipulation"
          >
            Reset all devices
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0c0c0e] pb-8">
      <header className="border-b border-zinc-800/80 bg-[#121214]/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-bold text-red-400">8BP</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold leading-tight text-sm sm:text-base truncate">License Panel</h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">Aim Engine</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button onClick={() => setShowCreate(true)} className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-medium transition touch-manipulation">
              + Create Key
            </button>
            <button onClick={load} className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm transition touch-manipulation">
              Refresh
            </button>
            <button onClick={logout} className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-400 transition touch-manipulation">
              Logout
            </button>
          </div>

          <div className="flex sm:hidden items-center gap-1.5">
            <button onClick={() => setShowCreate(true)} className="px-2.5 py-1.5 rounded-xl bg-red-600 text-xs font-medium touch-manipulation">
              + Key
            </button>
            <button onClick={() => setMenuOpen((v) => !v)} className="p-2 rounded-xl bg-zinc-800 touch-manipulation" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-zinc-800 px-3 py-2 flex gap-2 bg-[#121214]">
            <button onClick={() => { load(); setMenuOpen(false); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm touch-manipulation">Refresh</button>
            <button onClick={() => { setMenuOpen(false); logout(); }} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-sm text-red-400 touch-manipulation">Logout</button>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
          {[
            { label: 'Total', value: stats.total, color: 'text-zinc-100' },
            { label: 'Active', value: stats.active, color: 'text-red-400' },
            { label: 'Expired', value: stats.expired, color: 'text-amber-400' },
            { label: 'Banned', value: stats.banned, color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-[#141416] px-3 py-2.5 sm:px-4 sm:py-3">
              <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-xl sm:text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm break-words">{error}</div>
        )}

        {loading ? (
          <p className="text-center text-zinc-500 py-12">Cargando…</p>
        ) : licenses.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-zinc-800 rounded-2xl px-4">
            <p className="text-zinc-500 mb-3">No hay keys todavía</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2.5 rounded-xl bg-red-600 text-sm font-medium touch-manipulation">
              Crear primera key
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {licenses.map((lic) => (
              <LicenseCard key={lic.id} lic={lic} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-700 bg-[#161618] p-5 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4 sm:hidden" />
            <h2 className="text-lg font-semibold mb-4">Nueva License Key</h2>
            <label className="block text-xs text-zinc-400 mb-1">Key (vacío = auto)</label>
            <input value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="LYN8BP-XXXX-XXXX" className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm font-mono" />
            <label className="block text-xs text-zinc-400 mb-1">Note / label</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm" />
            <label className="block text-xs text-zinc-400 mb-1">Max devices (0 = unlimited)</label>
            <input type="number" min={0} value={maxDevices} onChange={(e) => setMaxDevices(Number(e.target.value))} className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm" />
            <label className="block text-xs text-zinc-400 mb-1">Expires (fecha y hora · vacío = lifetime)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full mb-5 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-sm touch-manipulation">Cancelar</button>
              <button disabled={busy === 'create'} onClick={createKey} className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-sm font-medium disabled:opacity-50 touch-manipulation">
                {busy === 'create' ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editLic && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-zinc-700 bg-[#161618] p-5 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4 sm:hidden" />
            <h2 className="text-lg font-semibold mb-4">Editar License Key</h2>
            <label className="block text-xs text-zinc-400 mb-1">Key</label>
            <input value={editKey} onChange={(e) => setEditKey(e.target.value)} className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm font-mono" />
            <label className="block text-xs text-zinc-400 mb-1">Note / label</label>
            <input value={editNote} onChange={(e) => setEditNote(e.target.value)} className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm" />
            <label className="block text-xs text-zinc-400 mb-1">Status</label>
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'active' | 'expired' | 'banned')} className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm">
              <option value="active">active</option>
              <option value="expired">expired</option>
              <option value="banned">banned</option>
            </select>
            <label className="block text-xs text-zinc-400 mb-1">Max devices (0 = unlimited)</label>
            <input type="number" min={0} value={editMaxDevices} onChange={(e) => setEditMaxDevices(Number(e.target.value))} className="w-full mb-3 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm" />
            <label className="block text-xs text-zinc-400 mb-1">Expires (fecha y hora · vacío = lifetime)</label>
            <input
              type="datetime-local"
              value={editExpiresAt}
              onChange={(e) => setEditExpiresAt(e.target.value)}
              className="w-full mb-5 px-3 py-3 sm:py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditLic(null)} className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-sm touch-manipulation">Cancelar</button>
              <button disabled={busy === editLic.id || !editKey.trim()} onClick={saveEdit} className="flex-1 px-4 py-3 rounded-xl bg-sky-600 text-sm font-medium disabled:opacity-50 touch-manipulation">
                {busy === editLic.id ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
