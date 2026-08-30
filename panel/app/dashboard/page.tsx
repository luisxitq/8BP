'use client';

  import { useState, useEffect, useCallback } from 'react';

  interface License {
    id: number;
    key: string;
    status: 'active' | 'expired' | 'banned';
    game_type: string;
    max_devices: number;
    active_devices: number;
    note: string;
    created_at: string;
    expires_at: string | null;
    hwid: string;
    features: string;
  }

  interface Stats {
    total: string;
    active: string;
    expired: string;
    banned: string;
  }

  const STATUS_BG: Record<string, string>     = { active: '#052e16', expired: '#2d1f00', banned: '#2d1515' };
  const STATUS_COLOR: Record<string, string>  = { active: '#22c55e', expired: '#f59e0b', banned: '#ef4444' };
  const STATUS_BORDER: Record<string, string> = { active: '#14532d', expired: '#5c3900', banned: '#5c2020' };

  function formatDate(d: string | null): string {
    if (!d) return 'Lifetime';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function daysLeft(d: string | null): string {
    if (!d) return 'inf';
    const diff = new Date(d).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / 86400000);
    return days > 365 ? Math.floor(days/365) + 'y' : days + 'd';
  }

  function truncateKey(key: string): string {
    if (key.length <= 20) return key;
    return key.slice(0, 10) + '...' + key.slice(-6);
  }

  // ── SVG Icons ──────────────────────────────────────────────────────────────────
  const IconKey = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
  const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
  const IconClock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
  const IconBan = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
  const IconCopy = ({ copied }: { copied: boolean }) => copied ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
  const IconPlus = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
  const IconRefresh = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
  const IconLogout = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
  const IconSearch = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9898b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
  const IconCalendar = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
  const IconDevice = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
  const IconExtend = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="12" y1="2" x2="12" y2="4"/>
    </svg>
  );
  const IconTrash = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
  const IconReset = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
    </svg>
  );
  const IconFeature = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );

  // ── Helpers ────────────────────────────────────────────────────────────────────
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 640;

  export default function DashboardPage() {
    const [licenses, setLicenses]       = useState<License[]>([]);
    const [stats, setStats]             = useState<Stats>({ total: '0', active: '0', expired: '0', banned: '0' });
    const [search, setSearch]           = useState('');
    const [filter, setFilter]           = useState('all');
    const [loading, setLoading]         = useState(true);
    const [showCreate, setShowCreate]   = useState(false);
    const [extendTarget, setExtendTarget] = useState<License | null>(null);
    const [featuresTarget, setFeaturesTarget] = useState<License | null>(null);
    const [copied, setCopied]           = useState('');
    const [setupDone, setSetupDone]     = useState(false);
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [showAll, setShowAll]             = useState(false);

    const fetchData = useCallback(async () => {
      try {
        const res = await fetch('/api/licenses');
        if (res.status === 500 && !setupDone) {
          await fetch('/api/setup', { method: 'POST' });
          setSetupDone(true);
          return;
        }
        const data = await res.json();
        setLicenses(data.licenses ?? []);
        setStats(data.stats ?? { total: '0', active: '0', expired: '0', banned: '0' });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, [setupDone]);

    useEffect(() => { fetchData(); }, [fetchData]);

    async function handleLogout() {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }

    async function handleSetStatus(id: number, status: string) {
      await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    }

    async function handleDelete(id: number) {
      if (!confirm('Delete this license key?')) return;
      await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      fetchData();
    }

    async function handleExtend(id: number, days: number) {
      await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend_days: days }),
      });
      setExtendTarget(null);
      fetchData();
    }

    async function handleResetHwid(id: number) {
      if (!confirm('Reset HWID for this key? The device will need to log in again.')) return;
      await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_hwid: true }),
      });
      fetchData();
    }

    async function handleSaveFeatures(id: number, features: string) {
      await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });
      setFeaturesTarget(null);
      fetchData();
    }

    function handleCopy(key: string, e?: React.MouseEvent) {
      e?.stopPropagation();
      navigator.clipboard.writeText(key);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    }

    const filtered = licenses.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        l.key.toLowerCase().includes(q) ||
        (l.note ?? '').toLowerCase().includes(q) ||
        (l.hwid ?? '').toLowerCase().includes(q);
      const matchFilter = filter === 'all' || l.status === filter;
      return matchSearch && matchFilter;
    });

    const STAT_CARDS = [
      { label: 'Total Keys', value: stats.total,   color: '#6366f1', Icon: IconKey },
      { label: 'Active',     value: stats.active,  color: '#22c55e', Icon: IconCheck },
      { label: 'Expired',    value: stats.expired, color: '#f59e0b', Icon: IconClock },
      { label: 'Banned',     value: stats.banned,  color: '#ef4444', Icon: IconBan },
    ];

    return (
      <div style={{ minHeight: '100vh', background: '#0b0b0f' }}>
        {/* Navbar */}
        <nav style={{
          background: '#13131a',
          borderBottom: '1px solid #22222e',
          padding: '0 16px',
          height: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: '#6366f1' }}><IconKey /></div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#e2e2ea', letterSpacing: '-0.2px' }}>KZ License Panel</span>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: '1px solid #22222e', color: '#9898b0', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <IconLogout /> Logout
          </button>
        </nav>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 14px' }}>

          {/* Stats grid */}
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            {STAT_CARDS.map((s) => (
              <div key={s.label} style={{ background: '#13131a', border: '1px solid #22222e', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ color: s.color, marginBottom: 8 }}><s.Icon /></div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#9898b0', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <IconSearch />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keys, notes, HWID..."
                style={{ width: '100%', background: '#13131a', border: '1px solid #22222e', color: '#e2e2ea', borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ background: '#13131a', border: '1px solid #22222e', color: '#e2e2ea', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="banned">Banned</option>
            </select>
            <button
              onClick={() => setShowCreate(true)}
              style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <IconPlus /> Create Key
            </button>
            <button
              onClick={fetchData}
              title="Refresh"
              style={{ background: '#13131a', color: '#9898b0', border: '1px solid #22222e', borderRadius: 10, padding: '9px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <IconRefresh />
            </button>
          </div>

          {/* ── Desktop Table ── */}
          <div className="desktop-table" style={{ background: '#13131a', border: '1px solid #22222e', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #22222e', background: '#0f0f14' }}>
                    <th style={TH}>License Key</th>
                    <th style={TH}>Status</th>
                    <th style={TH}>Game</th>
                    <th style={TH}>Expires</th>
                    <th style={TH}>Devices</th>
                    <th style={TH}>Note</th>
                    <th style={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9898b0' }}>Loading...</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9898b0' }}>No license keys found</td></tr>
                  )}
                  {(showAll ? filtered : filtered.slice(0, 3)).map((l) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #17171f' }}>
                      {/* Key */}
                      <td style={{ padding: '11px 14px', maxWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            onClick={() => setExpandedKey(expandedKey === l.key ? null : l.key)}
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 12,
                              color: '#a5b4fc',
                              cursor: 'pointer',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: expandedKey === l.key ? 'normal' : 'nowrap',
                              maxWidth: expandedKey === l.key ? 'none' : 160,
                              wordBreak: expandedKey === l.key ? 'break-all' : 'normal',
                              display: 'block',
                            }}
                            title={l.key}
                          >
                            {expandedKey === l.key ? l.key : truncateKey(l.key)}
                          </span>
                          <button
                            onClick={(e) => handleCopy(l.key, e)}
                            title="Copy key"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === l.key ? '#22c55e' : '#6366f1', padding: '2px', lineHeight: 0, flexShrink: 0 }}
                          >
                            <IconCopy copied={copied === l.key} />
                          </button>
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: STATUS_BG[l.status] ?? '#1e1e2a', color: STATUS_COLOR[l.status] ?? '#9898b0', border: `1px solid ${STATUS_BORDER[l.status] ?? '#2a2a3a'}`, borderRadius: 5, padding: '2px 8px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          {l.status}
                        </span>
                      </td>
                      {/* Game */}
                      <td style={{ padding: '11px 14px', color: '#9898b0' }}>{l.game_type}</td>
                      {/* Expires */}
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ color: '#9898b0', fontSize: 12 }}>{formatDate(l.expires_at)}</div>
                        <div style={{ fontSize: 11, color: daysLeft(l.expires_at) === 'Expired' ? '#ef4444' : '#6366f1', marginTop: 1 }}>{daysLeft(l.expires_at)}</div>
                      </td>
                      {/* Devices */}
                      <td style={{ padding: '11px 14px', color: '#9898b0', textAlign: 'center' }}>{l.active_devices ?? 0}/{l.max_devices}</td>
                      {/* Note */}
                      <td style={{ padding: '11px 14px', color: '#9898b0', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                        {l.note || <span style={{ opacity: 0.3 }}>—</span>}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                          {l.status !== 'active' && (
                            <button onClick={() => handleSetStatus(l.id, 'active')} style={ACT_BTN('#052e16','#22c55e','#14532d')}>Activate</button>
                          )}
                          {l.status !== 'banned' && (
                            <button onClick={() => handleSetStatus(l.id, 'banned')} style={ACT_BTN('#2d1515','#ef4444','#5c2020')}>Ban</button>
                          )}
                          <button onClick={() => setExtendTarget(l)} title="Extend expiry" style={ACT_BTN('#0c1a2e','#60a5fa','#1e3a5f')}>
                            <IconExtend />
                          </button>
                          <button onClick={() => handleResetHwid(l.id)} title="Reset HWID"
                            style={ACT_BTN('#1a1a24','#f59e0b','#92400e')}>
                            <IconReset />
                          </button>
                          <button onClick={() => setFeaturesTarget(l)} title="Features"
                            style={ACT_BTN('#0e1f1f','#34d399','#065f46')}>
                            <IconFeature />
                          </button>
                          <button onClick={() => handleDelete(l.id)} title="Delete" style={ACT_BTN('#1e1e2a','#9898b0','#2a2a3a')}>
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="mobile-cards">
            {loading && <div style={{ padding: 40, textAlign: 'center', color: '#9898b0' }}>Loading...</div>}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#9898b0' }}>No license keys found</div>
            )}
            {(showAll ? filtered : filtered.slice(0, 3)).map((l) => (
              <div key={l.id} style={{ background: '#13131a', border: '1px solid #22222e', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                {/* Key row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>License Key</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#a5b4fc', wordBreak: 'break-all', lineHeight: 1.5 }}>{l.key}</div>
                  </div>
                  <button
                    onClick={(e) => handleCopy(l.key, e)}
                    style={{ background: copied === l.key ? '#052e16' : '#1e1e2a', border: `1px solid ${copied === l.key ? '#14532d' : '#2a2a3a'}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: copied === l.key ? '#22c55e' : '#6366f1', lineHeight: 0, flexShrink: 0 }}
                  >
                    <IconCopy copied={copied === l.key} />
                  </button>
                </div>

                {/* Info row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                    <span style={{ background: STATUS_BG[l.status], color: STATUS_COLOR[l.status], border: `1px solid ${STATUS_BORDER[l.status]}`, borderRadius: 5, padding: '2px 8px', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                      {l.status}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expires</div>
                    <div style={{ fontSize: 12, color: '#e2e2ea' }}>{formatDate(l.expires_at)} <span style={{ color: daysLeft(l.expires_at) === 'Expired' ? '#ef4444' : '#6366f1', fontSize: 11 }}>({daysLeft(l.expires_at)})</span></div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Game</div>
                    <div style={{ fontSize: 12, color: '#e2e2ea' }}>{l.game_type}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Devices</div>
                    <div style={{ fontSize: 12, color: '#e2e2ea' }}>{l.active_devices ?? 0}/{l.max_devices}</div>
                  </div>
                  {l.note && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Note</div>
                      <div style={{ fontSize: 12, color: '#e2e2ea' }}>{l.note}</div>
                    </div>
                  )}
                  {l.hwid && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 10, color: '#9898b0', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>HWID</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9898b0', wordBreak: 'break-all' }}>{l.hwid}</div>
                    </div>
                  )}
                </div>

                {/* Action row */}
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #1e1e2a', paddingTop: 10 }}>
                  {l.status !== 'active' && (
                    <button onClick={() => handleSetStatus(l.id, 'active')} style={{ ...ACT_BTN('#052e16','#22c55e','#14532d'), flex: 1, justifyContent: 'center' }}>Activate</button>
                  )}
                  {l.status !== 'banned' && (
                    <button onClick={() => handleSetStatus(l.id, 'banned')} style={{ ...ACT_BTN('#2d1515','#ef4444','#5c2020'), flex: 1, justifyContent: 'center' }}>Ban</button>
                  )}
                  <button onClick={() => setExtendTarget(l)} style={{ ...ACT_BTN('#0c1a2e','#60a5fa','#1e3a5f'), flex: 1, justifyContent: 'center', gap: 4 }}>
                    <IconExtend /> Extend
                  </button>
                  <button onClick={() => handleResetHwid(l.id)} style={{ ...ACT_BTN('#1a1a24','#f59e0b','#92400e'), flex: 1, justifyContent: 'center' }} title='Reset HWID'>
                    <IconReset />
                  </button>
                  <button onClick={() => setFeaturesTarget(l)} style={{ ...ACT_BTN('#0e1f1f','#34d399','#065f46'), flex: 1, justifyContent: 'center' }} title='Features'>
                    <IconFeature />
                  </button>
                  <button onClick={() => handleDelete(l.id)} style={{ ...ACT_BTN('#1e1e2a','#9898b0','#2a2a3a'), padding: '6px 10px' }}>
                    <IconTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Load More — single button at bottom ── */}
          {filtered.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: 14, marginBottom: 4 }}>
              <button
                onClick={() => setShowAll(v => !v)}
                style={{
                  background: showAll ? '#1a1a24' : '#1e1b4b',
                  border: `1px solid ${showAll ? '#22222e' : '#4338ca'}`,
                  color: showAll ? '#9898b0' : '#818cf8',
                  borderRadius: 10,
                  padding: '10px 32px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.2px',
                }}
              >
                {showAll ? '▲ Show Less' : `Load More... (${filtered.length - 3} more)`}
              </button>
            </div>
          )}

          <div style={{ marginTop: 12, color: '#9898b0', fontSize: 12 }}>
            Showing {showAll ? filtered.length : Math.min(3, filtered.length)} of {licenses.length} keys
          </div>
        </div>

        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchData} />}
        {extendTarget && (
          <ExtendModal
            license={extendTarget}
            onClose={() => setExtendTarget(null)}
            onExtend={(days) => handleExtend(extendTarget.id, days)}
          />
        )}
        {featuresTarget && (
          <FeaturesModal
            license={featuresTarget}
            onClose={() => setFeaturesTarget(null)}
            onSave={(f) => handleSaveFeatures(featuresTarget.id, f)}
          />
        )}
      </div>
    );
  }

  // ── Style helpers ──────────────────────────────────────────────────────────────
  const TH: React.CSSProperties = {
    padding: '12px 14px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    color: '#9898b0',
    whiteSpace: 'nowrap',
    letterSpacing: '0.3px',
  };

  function ACT_BTN(bg: string, color: string, border: string): React.CSSProperties {
    return {
      background: bg,
      color,
      border: `1px solid ${border}`,
      borderRadius: 6,
      padding: '5px 9px',
      fontSize: 11,
      cursor: 'pointer',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 3,
      whiteSpace: 'nowrap',
    };
  }

  /* ─── Create Modal ──────────────────────────────────────────────────────────── */
  // ── Available mod features ──────────────────────────────────────────────────
  // Features sesuai menu.h: bAutoPlay (autoplay) + bESP_* / bEnemyLine (esp)
  const ALL_FEATURES = [
    { id: 'autoplay', label: 'Auto Play',  color: '#6366f1' },
    { id: 'esp',      label: 'ESP / Lines', color: '#a78bfa' },
  ];

  interface CreateModalProps { onClose: () => void; onCreated: () => void; }

  function CreateModal({ onClose, onCreated }: CreateModalProps) {
      const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      function seg(n = 4) { return Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''); }
      function randomLynKey() { return `LYN8BP-${seg()}-${seg()}`; }

      const [form, setForm]         = useState({ game_type: '8ball', max_devices: '1', note: '', expires_at: '', custom_key: '', features: [] as string[] });
      const [loading, setLoading]   = useState(false);
      const [error, setError]       = useState('');
      const [created, setCreated]   = useState<string | null>(null);

      async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setError('');
        const expiresIso = form.expires_at ? new Date(form.expires_at).toISOString() : null;
        const res = await fetch('/api/licenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_type: form.game_type, max_devices: Number(form.max_devices), note: form.note, expires_at: expiresIso, custom_key: form.custom_key || undefined, features: form.features }),
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) { setError(data.error ?? 'Unknown error'); return; }
        setCreated(data.license.key);
        onCreated();
      }

      function addTime(days: number) {
        const base = form.expires_at ? new Date(form.expires_at) : new Date();
        base.setDate(base.getDate() + days);
        const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setForm(f => ({ ...f, expires_at: local }));
      }
      function addMonths(m: number) {
        const base = form.expires_at ? new Date(form.expires_at) : new Date();
        base.setMonth(base.getMonth() + m);
        const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setForm(f => ({ ...f, expires_at: local }));
      }

      const INP: React.CSSProperties = { width: '100%', background: '#1a1a24', border: '1px solid #22222e', color: '#e2e2ea', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
      const LBL: React.CSSProperties = { display: 'block', fontSize: 11, color: '#9898b0', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' };
      const PRESET_BTN = (): React.CSSProperties => ({ background: '#1a1a24', color: '#9898b0', border: '1px solid #22222e', borderRadius: 7, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 });
    type TimePreset = { label: string; days?: number; months?: number };
      const timePresets: TimePreset[] = [
        {label:'7d',days:7},{label:'30d',days:30},
        {label:'1m',months:1},{label:'3m',months:3},{label:'6m',months:6},{label:'1y',months:12}
      ];

      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
          <div style={{ background: '#13131a', border: '1px solid #22222e', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 460, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ color: '#e2e2ea', fontWeight: 700, fontSize: 16, margin: 0 }}>Create License Key</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9898b0', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            {created ? (
              <div>
                <div style={{ background: '#052e16', border: '1px solid #14532d', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#86efac', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Key Created</div>
                  <code style={{ color: '#a5b4fc', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>{created}</code>
                </div>
                <button onClick={() => navigator.clipboard.writeText(created ?? '')} style={{ width: '100%', background: '#312e81', color: '#a5b4fc', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <IconCopy copied={false} /> Copy Key
                </button>
                <button onClick={onClose} style={{ width: '100%', background: '#1a1a24', color: '#9898b0', border: '1px solid #22222e', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ background: '#2d1515', border: '1px solid #5c2020', color: '#f87171', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{error}</div>}

                <div>
                  <label style={LBL}>License Key</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="LYN8BP-XXXX-XXXX (kosong = auto-generate)"
                      value={form.custom_key}
                      onChange={(e) => setForm(f => ({ ...f, custom_key: e.target.value }))}
                      style={{ ...INP, flex: 1 }}
                    />
                    <button type="button" onClick={() => setForm(f => ({ ...f, custom_key: randomLynKey() }))}
                      style={{ background: '#1e3a5f', color: '#60a5fa', border: '1px solid #3b82f6', borderRadius: 8, padding: '0 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      🎲 Random
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#4a4a60', marginTop: 4 }}>Format: LYN8BP-XXXX-XXXX</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={LBL}>Game Type</label>
                    <select value={form.game_type} onChange={(e) => setForm(f => ({ ...f, game_type: e.target.value }))} style={INP}>
                      <option value="8ball">8 Ball Pool</option>
                      <option value="any">Any</option>
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Max Devices</label>
                    <input type="number" min="0" value={form.max_devices} onChange={(e) => setForm(f => ({ ...f, max_devices: e.target.value }))} style={INP} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <label style={{ ...LBL, marginBottom: 0 }}>Expiry (kosong = Lifetime)</label>
                    {form.expires_at && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, expires_at: '' }))}
                        style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                    )}
                  </div>
                  <input type="datetime-local" value={form.expires_at}
                    onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    style={{ ...INP, colorScheme: 'dark' }} />
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: '#4a4a60', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Quick add dari sekarang / expiry saat ini</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {timePresets.map(p => (
                        <button key={p.label} type="button"
                          onClick={() => p.months !== undefined ? addMonths(p.months) : addTime(p.days ?? 0)}
                          style={PRESET_BTN()}>+{p.label}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
              <div>
                <label style={LBL}>Features / Fitur Mod</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {ALL_FEATURES.map(f => {
                    const on = form.features.includes(f.id);
                    return (
                      <button key={f.id} type="button"
                        onClick={() => setForm(p => ({ ...p, features: on ? p.features.filter(x => x !== f.id) : [...p.features, f.id] }))}
                        style={{ background: on ? '#0d1f12' : '#1a1a24', color: on ? f.color : '#9898b0',
                          border: `1px solid ${on ? f.color : '#22222e'}`, borderRadius: 7, padding: '5px 12px',
                          fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? f.color : '#333', display: 'inline-block' }} />
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, color: '#4a4a60', marginTop: 4 }}>Kosong = semua fitur aktif</div>
              </div>

                  <label style={LBL}>Note</label>
                  <input placeholder="Username, Telegram, etc." value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} style={INP} />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
                  <button type="button" onClick={onClose} style={{ flex: 1, background: '#1a1a24', color: '#9898b0', border: '1px solid #22222e', borderRadius: 8, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, background: loading ? '#312e81' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

  /* ─── Extend Modal ──────────────────────────────────────────────────────────── */
  interface ExtendModalProps {
    license: { id: number; key: string; expires_at: string | null; status: string };
    onClose: () => void;
    onExtend: (days: number) => void;
  }

  function ExtendModal({ license, onClose, onExtend }: ExtendModalProps) {
      const [mode, setMode]       = useState<'days'|'months'>('days');
      const [days, setDays]       = useState('30');
      const [months, setMonths]   = useState('1');
      const [loading, setLoading] = useState(false);
      const [error, setError]     = useState('');
      const dayPresets            = [7, 14, 30, 90, 180, 365];
      const monthPresets          = [1, 2, 3, 6, 12];

      function effectiveDays() {
        if (mode === 'months') return Math.round(Number(months) * 30.44);
        return Number(days);
      }

      function newExpiryPreview(): string {
        const d = effectiveDays();
        if (!d || d < 1) return '—';
        const base = license.expires_at && new Date(license.expires_at) > new Date() ? new Date(license.expires_at) : new Date();
        if (mode === 'months') base.setMonth(base.getMonth() + Number(months));
        else base.setDate(base.getDate() + d);
        return base.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const d = effectiveDays();
        if (!d || d < 1 || d > 3650) { setError(mode === 'days' ? 'Enter 1–3650 days' : 'Enter 1–120 months'); return; }
        setLoading(true);
        onExtend(d);
      }

      const INP: React.CSSProperties = { width: '100%', background: '#1a1a24', border: '1px solid #22222e', color: '#e2e2ea', borderRadius: 8, padding: '10px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' };
      const LBL: React.CSSProperties = { display: 'block', fontSize: 11, color: '#9898b0', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' };
      const tabBtn = (active: boolean): React.CSSProperties => ({ flex: 1, background: active ? '#1e3a5f' : '#1a1a24', color: active ? '#60a5fa' : '#9898b0', border: `1px solid ${active ? '#3b82f6' : '#22222e'}`, borderRadius: 7, padding: '7px', fontSize: 12, cursor: 'pointer', fontWeight: 700 });
      const presetBtn = (active: boolean): React.CSSProperties => ({ background: active ? '#1e3a5f' : '#1a1a24', color: active ? '#60a5fa' : '#9898b0', border: `1px solid ${active ? '#3b82f6' : '#22222e'}`, borderRadius: 7, padding: '5px 11px', fontSize: 12, cursor: 'pointer', fontWeight: 600 });

      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#13131a', border: '1px solid #1e3a5f', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ color: '#e2e2ea', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>Extend License</h2>
                <code style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{license.key}</code>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9898b0', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ background: '#0f1929', border: '1px solid #1e3a5f', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#9898b0' }}>Current expiry</span>
                <span style={{ color: license.expires_at ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                  {license.expires_at ? new Date(license.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Lifetime'}
                </span>
              </div>
              {effectiveDays() > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#9898b0' }}>New expiry</span>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>→ {newExpiryPreview()}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <button type="button" onClick={() => { setMode('days'); setError(''); }} style={tabBtn(mode === 'days')}>+ Hari</button>
              <button type="button" onClick={() => { setMode('months'); setError(''); }} style={tabBtn(mode === 'months')}>+ Bulan</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && <div style={{ background: '#2d1515', border: '1px solid #5c2020', color: '#f87171', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}

              {mode === 'days' ? (
                <>
                  <div>
                    <label style={LBL}>Quick select (hari)</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {dayPresets.map(p => (
                        <button key={p} type="button" onClick={() => setDays(String(p))} style={presetBtn(days === String(p))}>
                          {p >= 365 ? '1yr' : p >= 180 ? '6mo' : p >= 90 ? '3mo' : `${p}d`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Custom hari</label>
                    <input type="number" min="1" max="3650" value={days} onChange={(e) => { setDays(e.target.value); setError(''); }} style={INP} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={LBL}>Quick select (bulan)</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {monthPresets.map(p => (
                        <button key={p} type="button" onClick={() => setMonths(String(p))} style={presetBtn(months === String(p))}>
                          {p >= 12 ? '1 tahun' : `${p} bln`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={LBL}>Custom bulan</label>
                    <input type="number" min="1" max="120" value={months} onChange={(e) => { setMonths(e.target.value); setError(''); }} style={INP} />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, background: '#1a1a24', color: '#9898b0', border: '1px solid #22222e', borderRadius: 8, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, background: loading ? '#1e3a5f' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Extending...' : mode === 'days' ? `+ ${days || '?'} hari` : `+ ${months || '?'} bulan`}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

  /* ─── Features Modal ─────────────────────────────────────────────────────────── */
  interface FeaturesModalProps {
    license: { id: number; key: string; features: string };
    onClose: () => void;
    onSave: (features: string) => void;
  }

  function FeaturesModal({ license, onClose, onSave }: FeaturesModalProps) {
    const init = license.features ? license.features.split(',').map(s => s.trim()).filter(Boolean) : [];
    const [selected, setSelected] = useState<string[]>(init);
    const [loading, setLoading]   = useState(false);

    function toggle(id: string) {
      setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    }

    function handleSave(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      onSave(selected.join(','));
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
        <div style={{ background: '#13131a', border: '1px solid #065f46', borderRadius: 16, padding: '24px', width: '100%', maxWidth: 420 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ color: '#e2e2ea', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>Fitur Mod</h2>
              <code style={{ color: '#34d399', fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{license.key}</code>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9898b0', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ background: '#0a1a12', border: '1px solid #064e3b', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontSize: 12, color: '#6ee7b7' }}>
            Pilih fitur yang aktif untuk key ini. Kosong = semua fitur aktif (default).
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ALL_FEATURES.map(f => {
                const on = selected.includes(f.id);
                return (
                  <button key={f.id} type="button" onClick={() => toggle(f.id)}
                    style={{ background: on ? '#0d1f12' : '#1a1a24', color: on ? f.color : '#9898b0',
                      border: `1px solid ${on ? f.color : '#22222e'}`, borderRadius: 8, padding: '9px 14px',
                      fontSize: 12, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: on ? f.color : '#333', flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{f.label}</span>
                    {on && <span style={{ fontSize: 10, opacity: 0.7 }}>✓ ON</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={() => setSelected([])}
                style={{ flex: 1, background: '#1a1a24', color: '#9898b0', border: '1px solid #22222e', borderRadius: 8, padding: 10, fontSize: 12, cursor: 'pointer' }}>
                Reset Semua
              </button>
              <button type="button" onClick={() => setSelected(ALL_FEATURES.map(f => f.id))}
                style={{ flex: 1, background: '#1a1a24', color: '#34d399', border: '1px solid #065f46', borderRadius: 8, padding: 10, fontSize: 12, cursor: 'pointer' }}>
                Aktifkan Semua
              </button>
              <button type="submit" disabled={loading}
                style={{ flex: 2, background: loading ? '#064e3b' : '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Saving...' : 'Simpan Fitur'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }