import { RTDB_URL } from './config';

export interface License {
  id: string;
  key: string;
  status: 'active' | 'expired' | 'banned';
  game_type: string;
  max_devices: number;
  note: string;
  created_at: string;
  expires_at: string | null;
  hwid: string; // legacy single
  devices: string[];
  features: string;
  active_devices?: number;
}

function pathKey(key: string): string {
  return key.replace(/[.#$\[\]]/g, '_');
}

function licensesUrl(path = ''): string {
  const base = `${RTDB_URL}/licenses`;
  if (!path) return `${base}.json`;
  return `${base}/${encodeURIComponent(path)}.json`;
}

/** Safe Firebase key for a device (unique per hwid) */
function deviceSafeKey(hwid: string): string {
  const s = String(hwid).trim();
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(s, 'utf8').toString('base64url').slice(0, 200) || pathKey(s);
    }
    const b64 = btoa(unescape(encodeURIComponent(s)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
    return b64.slice(0, 200) || pathKey(s);
  } catch {
    return pathKey(s);
  }
}

/** Single device node — avoids race when 2 devices login at once */
function deviceChildUrl(licenseId: string, hwid: string): string {
  const safe = deviceSafeKey(hwid);
  return `${RTDB_URL}/licenses/${encodeURIComponent(licenseId)}/devices/${encodeURIComponent(safe)}.json`;
}

function devicesNodeUrl(licenseId: string): string {
  return `${RTDB_URL}/licenses/${encodeURIComponent(licenseId)}/devices.json`;
}

async function rtdbGet<T = unknown>(url: string): Promise<T | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`RTDB GET ${res.status}: ${await res.text()}`);
  return (await res.json()) as T | null;
}

async function rtdbPut(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RTDB PUT ${res.status}: ${await res.text()}`);
}

async function rtdbPatch(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`RTDB PATCH ${res.status}: ${await res.text()}`);
}

async function rtdbDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`RTDB DELETE ${res.status}: ${await res.text()}`);
}

function parseDevices(data: Record<string, unknown>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (v: unknown) => {
    const s = String(v ?? '').trim();
    if (!s || s === 'true' || s === 'false' || s === 'null') return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  const raw = data.devices;

  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (v && typeof v === 'object' && v !== null && 'hwid' in v) {
        add((v as { hwid: unknown }).hwid);
      } else {
        add(v);
      }
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string' && v.length > 0) {
        // value is the real hwid
        add(v);
      } else if (v && typeof v === 'object' && v !== null && 'hwid' in v) {
        add((v as { hwid: unknown }).hwid);
      } else if (v === true || v === 1) {
        // key is the hwid (map style)
        add(k);
      } else if (typeof v === 'boolean' || typeof v === 'number') {
        if (!/^\d+$/.test(k)) add(k);
      } else if (v != null && typeof v !== 'object') {
        add(v);
      } else if (!/^\d+$/.test(k) && k.length > 3) {
        // fallback: use key if it looks like an id
        add(k);
      }
    }
  }

  // Always merge legacy single hwid field (may hold a 2nd device on old data)
  add(data.hwid);

  return out;
}

function devicesToMap(list: string[]): Record<string, boolean> {
  const m: Record<string, boolean> = {};
  for (const d of list) {
    const s = String(d || '').trim();
    if (s) m[s] = true;
  }
  return m;
}

function resolveStatus(
  raw: string | undefined,
  expiresAt: string | null
): License['status'] {
  // Banned siempre gana
  if (raw === 'banned') return 'banned';
  // Si la fecha/hora de expiración ya pasó → expired
  if (expiresAt && new Date(expiresAt) < new Date()) return 'expired';
  // Fecha futura o lifetime: si estaba "expired" por fecha vieja, se considera active
  if (raw === 'expired') return 'active';
  return (raw as License['status']) || 'active';
}

function mapLicense(id: string, data: Record<string, unknown>): License {
  const devices = parseDevices(data);
  const expires_at = data.expires_at ? String(data.expires_at) : null;
  return {
    id,
    key: String(data.key ?? id),
    status: resolveStatus(String(data.status ?? 'active'), expires_at),
    game_type: String(data.game_type ?? '8ball'),
    max_devices: Number(data.max_devices ?? 1),
    note: String(data.note ?? ''),
    created_at: String(data.created_at ?? ''),
    expires_at,
    hwid: devices[0] ?? '',
    devices,
    features: String(data.features ?? ''),
    active_devices: devices.length,
  };
}

export async function initDB(): Promise<void> {
  await rtdbPut(`${RTDB_URL}/_meta/init.json`, {
    initialized: true,
    at: new Date().toISOString(),
  });
}

export async function getAllLicenses(): Promise<License[]> {
  const val = await rtdbGet<Record<string, Record<string, unknown>>>(licensesUrl());
  if (!val || typeof val !== 'object') return [];
  const list = Object.entries(val).map(([id, raw]) => mapLicense(id, raw || {}));
  list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return list;
}

export async function getLicenseByKey(key: string): Promise<License | null> {
  const id = pathKey(key);
  const data = await rtdbGet<Record<string, unknown>>(licensesUrl(id));
  if (data && typeof data === 'object' && (data.key || data.status)) {
    return mapLicense(id, data);
  }
  const all = await getAllLicenses();
  return all.find((l) => l.key === key) ?? null;
}

export async function createLicense(data: {
  key: string;
  game_type: string;
  max_devices: number;
  note: string;
  expires_at: string | null;
  features: string;
}): Promise<License> {
  const existing = await getLicenseByKey(data.key);
  if (existing) throw new Error('Key already exists');

  const id = pathKey(data.key);
  const doc = {
    key: data.key,
    status: 'active' as const,
    game_type: data.game_type,
    max_devices: data.max_devices,
    note: data.note,
    created_at: new Date().toISOString(),
    expires_at: data.expires_at,
    hwid: '',
    devices: {} as Record<string, boolean>,
    features: data.features,
  };
  await rtdbPut(licensesUrl(id), doc);
  return { id, ...doc, devices: [], active_devices: 0 };
}

export async function updateLicenseStatus(id: string, status: string): Promise<void> {
  await rtdbPatch(licensesUrl(id), { status });
}

/** Add device HWID if under limit. Returns updated device list length. */
export async function registerDevice(
  key: string,
  hwid: string
): Promise<{ devices: string[]; active: number; max: number }> {
  const lic = await getLicenseByKey(key);
  if (!lic) throw new Error('License not found');

  const id = lic.id;
  const trimmed = String(hwid).trim();
  if (!trimmed) throw new Error('Missing HWID');

  // Read current devices (array OR object — both supported)
  const rawDevices = await rtdbGet<unknown>(devicesNodeUrl(id));
  let devices = parseDevices({
    devices: rawDevices,
    hwid: lic.hwid,
  } as Record<string, unknown>);

  if (devices.some((d) => d === trimmed)) {
    return { devices, active: devices.length, max: lic.max_devices };
  }

  const max = lic.max_devices;
  if (max > 0 && devices.length >= max) {
    throw new Error('Device limit reached');
  }

  // Append new hwid
  devices = [...devices, trimmed];

  // ALWAYS rewrite full devices map so nothing is lost (no partial array overwrite)
  // and convert legacy array form → object map
  const map: Record<string, string> = {};
  for (const d of devices) {
    map[deviceSafeKey(d)] = d;
  }
  await rtdbPut(devicesNodeUrl(id), map);

  // Keep legacy field in sync (first device)
  await rtdbPatch(licensesUrl(id), { hwid: devices[0] || '' });

  return { devices, active: devices.length, max };
}

export async function updateLicenseHwid(key: string, hwid: string): Promise<void> {
  await registerDevice(key, hwid);
}

export async function resetLicenseHwid(id: string): Promise<void> {
  await rtdbPut(devicesNodeUrl(id), null);
  await rtdbPatch(licensesUrl(id), { hwid: '' });
}

export async function removeDevice(id: string, hwid: string): Promise<void> {
  const target = String(hwid).trim();
  const rawDevices = await rtdbGet<unknown>(devicesNodeUrl(id));
  const prev = parseDevices({ devices: rawDevices } as Record<string, unknown>);

  // Prefer direct child delete
  await rtdbDelete(deviceChildUrl(id, target));

  // Also delete any entry that matches short id (last 8 chars)
  if (rawDevices && typeof rawDevices === 'object' && !Array.isArray(rawDevices)) {
    const short = target.slice(-8);
    for (const [k, v] of Object.entries(rawDevices as Record<string, unknown>)) {
      const val = typeof v === 'string' ? v : k;
      if (val === target || val.slice(-8) === short || k === pathKey(target)) {
        const child = `${RTDB_URL}/licenses/${encodeURIComponent(id)}/devices/${encodeURIComponent(k)}.json`;
        await rtdbDelete(child);
      }
    }
  }

  const next = prev.filter(
    (d) => d !== target && d.slice(-8) !== target.slice(-8)
  );
  if (next.length === prev.length) {
    // nothing removed from list view — still ok if child delete worked
  }

  await rtdbPatch(licensesUrl(id), { hwid: next[0] || '' });
}

export async function updateLicenseFeatures(id: string, features: string): Promise<void> {
  await rtdbPatch(licensesUrl(id), { features });
}

export async function deleteLicense(id: string): Promise<void> {
  await rtdbDelete(licensesUrl(id));
}

export async function getStats() {
  const list = await getAllLicenses();
  const now = new Date();
  let total = 0;
  let active = 0;
  let expired = 0;
  let banned = 0;
  for (const l of list) {
    total++;
    if (l.status === 'banned') banned++;
    else if (l.status === 'expired' || (l.expires_at && new Date(l.expires_at) < now)) expired++;
    else if (l.status === 'active') active++;
  }
  return { total, active, expired, banned };
}

export async function extendLicense(id: string, days: number): Promise<void> {
  const data = await rtdbGet<Record<string, unknown>>(licensesUrl(id));
  if (!data) return;
  const now = new Date();
  let base = data.expires_at ? new Date(String(data.expires_at)) : now;
  if (base < now) base = now;
  base.setDate(base.getDate() + days);
  const updates: Record<string, unknown> = { expires_at: base.toISOString() };
  if (data.status === 'expired') updates.status = 'active';
  await rtdbPatch(licensesUrl(id), updates);
}

export async function updateLicense(
  id: string,
  fields: {
    key?: string;
    max_devices?: number;
    expires_at?: string | null;
    status?: string;
    note?: string;
  }
): Promise<{ id: string }> {
  const data = await rtdbGet<Record<string, unknown>>(licensesUrl(id));
  if (!data) throw new Error('License not found');

  const newKey = fields.key !== undefined ? fields.key.trim() : String(data.key ?? id);
  if (!newKey) throw new Error('Key cannot be empty');

  const devices = parseDevices(data);
  const expires_at =
    fields.expires_at !== undefined ? fields.expires_at : (data.expires_at ?? null);
  let status = String(fields.status ?? data.status ?? 'active');
  // Si la fecha es futura (o lifetime) y no está banned, reactivar
  if (status !== 'banned') {
    if (!expires_at || new Date(String(expires_at)) >= new Date()) {
      if (status === 'expired') status = 'active';
    } else {
      status = 'expired';
    }
  }
  const merged = {
    key: newKey,
    status,
    game_type: data.game_type ?? '8ball',
    max_devices:
      fields.max_devices !== undefined ? Number(fields.max_devices) : Number(data.max_devices ?? 1),
    note: fields.note !== undefined ? fields.note : (data.note ?? ''),
    created_at: data.created_at ?? new Date().toISOString(),
    expires_at,
    hwid: devices[0] || '',
    devices,
    features: data.features ?? '',
  };

  const newId = pathKey(newKey);

  if (newId !== id) {
    const existing = await rtdbGet(licensesUrl(newId));
    if (existing && typeof existing === 'object' && (existing as Record<string, unknown>).key) {
      throw new Error('Key already exists');
    }
    await rtdbPut(licensesUrl(newId), merged);
    await rtdbDelete(licensesUrl(id));
    return { id: newId };
  }

  await rtdbPatch(licensesUrl(id), {
    key: merged.key,
    max_devices: merged.max_devices,
    expires_at: merged.expires_at,
    status: merged.status,
    note: merged.note,
  });
  return { id };
}
