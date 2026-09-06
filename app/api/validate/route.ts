import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, registerDevice } from '@/lib/db';
import { decryptPayload, encryptPayload } from '@/lib/keygen';
import { ENCRYPT_KEY, WS_TOKEN, MOD_VERSION } from '@/lib/config';

function fail(msg: string) {
  const payload = encryptPayload({ status: 'error', message: msg }, ENCRYPT_KEY);
  return NextResponse.json({ data: payload }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.token !== WS_TOKEN) return fail('Invalid token');
    
    const encoded = body.data as string;
    if (!encoded) return fail('Missing data');
    
    const payload = decryptPayload(encoded, ENCRYPT_KEY) as Record < string,
      string > | null;
    if (!payload) return fail('Failed to decrypt payload');
    
    const { license_key, hwid, game_type, version } = payload;
    
    if (!license_key) return fail('Missing license_key');
    if (!hwid) return fail('Missing HWID');
    if (version !== MOD_VERSION) return fail(`Old version. Update to ${MOD_VERSION}`);
    
    const license = await getLicenseByKey(license_key);
    if (!license) return fail('License key not found');
    
    if (license.status === 'banned') return fail('License key is banned');
    if (license.status === 'expired') return fail('License key has expired');
    
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return fail('License key has expired');
    }
    
    if (license.game_type !== '8ball' && license.game_type !== game_type) {
      return fail('Game type mismatch');
    }
    
    let activeDevices = license.devices?.length ?? 0;
    const maxDev = license.max_devices;
    
    try {
      const reg = await registerDevice(license_key, hwid);
      activeDevices = reg.active;
    } catch (e) {
      const msg = String(e);
      if (msg.includes('Device limit')) return fail('Device limit reached');
      throw e;
    }
    
    const expiryDate = license.expires_at ?
      new Date(license.expires_at).toISOString().replace('T', ' ').slice(0, 19) :
      'Lifetime';
    
    const features = license.features ?
      license.features.split(',').map((f: string) => f.trim()).filter(Boolean) :
      [];
    
    const AUTH_TOKEN = '0wQRlDkgoQlf';
    const responsePayload = {
      status: 'success',
      data: {
        auth_token: AUTH_TOKEN,
        expiry_date: expiryDate,
        version: MOD_VERSION,
        license_key: license_key,
        max_devices: maxDev,
        active_devices: activeDevices,
        features: features,
        panel_build: 'multi-hwid-v3',
      },
    };
    
    const encrypted = encryptPayload(responsePayload, ENCRYPT_KEY);
    return NextResponse.json({ data: encrypted });
  } catch (e) {
    return fail('Server error: ' + String(e));
  }
}