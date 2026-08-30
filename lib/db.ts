import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getDatabase, Database, Reference } from 'firebase-admin/database';

let app: App;
let rtdb: Database;

function getDb(): Database {
  if (!rtdb) {
    if (!getApps().length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error(
          'Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
        );
      }
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        databaseURL:
          process.env.FIREBASE_DATABASE_URL ||
          'https://aimengine-62132-default-rtdb.firebaseio.com',
      });
    } else {
      app = getApps()[0];
    }
    rtdb = getDatabase(app);
  }
  return rtdb;
}

function licensesRef(): Reference {
  return getDb().ref('licenses');
}

export interface License {
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

/** Sanitize license key for use as RTDB path segment */
function pathKey(key: string): string {
  return key.replace(/[.#$\[\]]/g, '_');
}

export async function initDB(): Promise<void> {
  await getDb().ref('_meta/init').set({
    initialized: true,
    at: new Date().toISOString(),
  });
}

export async function getAllLicenses(): Promise<License[]> {
  const snap = await licensesRef().once('value');
  const val = snap.val() || {};
  const list: License[] = Object.entries(val).map(([id, raw]) => {
    const data = raw as Record<string, unknown>;
    return {
      id,
      key: String(data.key ?? id),
      status: (data.status as License['status']) || 'active',
      game_type: String(data.game_type ?? '8ball'),
      max_devices: Number(data.max_devices ?? 1),
      note: String(data.note ?? ''),
      created_at: String(data.created_at ?? ''),
      expires_at: data.expires_at ? String(data.expires_at) : null,
      hwid: String(data.hwid ?? ''),
      features: String(data.features ?? ''),
      active_devices: data.hwid ? 1 : 0,
    };
  });
  list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return list;
}

export async function getLicenseByKey(key: string): Promise<License | null> {
  const id = pathKey(key);
  const snap = await licensesRef().child(id).once('value');
  if (!snap.exists()) {
    // Fallback: scan if stored under random push id
    const all = await licensesRef().orderByChild('key').equalTo(key).limitToFirst(1).once('value');
    if (!all.exists()) return null;
    const entries = Object.entries(all.val() as Record<string, unknown>);
    if (!entries.length) return null;
    const [foundId, raw] = entries[0];
    const data = raw as Record<string, unknown>;
    return {
      id: foundId,
      key: String(data.key ?? key),
      status: (data.status as License['status']) || 'active',
      game_type: String(data.game_type ?? '8ball'),
      max_devices: Number(data.max_devices ?? 1),
      note: String(data.note ?? ''),
      created_at: String(data.created_at ?? ''),
      expires_at: data.expires_at ? String(data.expires_at) : null,
      hwid: String(data.hwid ?? ''),
      features: String(data.features ?? ''),
    };
  }
  const data = snap.val() as Record<string, unknown>;
  return {
    id,
    key: String(data.key ?? key),
    status: (data.status as License['status']) || 'active',
    game_type: String(data.game_type ?? '8ball'),
    max_devices: Number(data.max_devices ?? 1),
    note: String(data.note ?? ''),
    created_at: String(data.created_at ?? ''),
    expires_at: data.expires_at ? String(data.expires_at) : null,
    hwid: String(data.hwid ?? ''),
    features: String(data.features ?? ''),
  };
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
    features: data.features,
  };
  await licensesRef().child(id).set(doc);
  return { id, ...doc };
}

export async function updateLicenseStatus(id: string, status: string): Promise<void> {
  await licensesRef().child(id).update({ status });
}

export async function updateLicenseHwid(key: string, hwid: string): Promise<void> {
  const lic = await getLicenseByKey(key);
  if (!lic) return;
  await licensesRef().child(lic.id).update({ hwid });
}

export async function resetLicenseHwid(id: string): Promise<void> {
  await licensesRef().child(id).update({ hwid: '' });
}

export async function updateLicenseFeatures(id: string, features: string): Promise<void> {
  await licensesRef().child(id).update({ features });
}

export async function deleteLicense(id: string): Promise<void> {
  await licensesRef().child(id).remove();
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
  const snap = await licensesRef().child(id).once('value');
  if (!snap.exists()) return;
  const data = snap.val() as Record<string, unknown>;
  const now = new Date();
  let base = data.expires_at ? new Date(String(data.expires_at)) : now;
  if (base < now) base = now;
  base.setDate(base.getDate() + days);
  const updates: Record<string, unknown> = {
    expires_at: base.toISOString(),
  };
  if (data.status === 'expired') updates.status = 'active';
  await licensesRef().child(id).update(updates);
}
