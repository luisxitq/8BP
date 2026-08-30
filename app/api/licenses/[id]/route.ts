import { NextRequest, NextResponse } from 'next/server';
import {
  deleteLicense,
  updateLicenseStatus,
  extendLicense,
  resetLicenseHwid,
  updateLicenseFeatures,
  updateLicense,
} from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteLicense(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const id = params.id;

    if (body.reset_hwid === true) {
      await resetLicenseHwid(id);
      return NextResponse.json({ ok: true });
    }

    if (typeof body.features === 'string') {
      await updateLicenseFeatures(id, body.features);
      return NextResponse.json({ ok: true });
    }

    if (typeof body.extend_days === 'number') {
      const days = Math.floor(body.extend_days);
      if (days < 1 || days > 3650) {
        return NextResponse.json({ error: 'extend_days must be 1–3650' }, { status: 400 });
      }
      await extendLicense(id, days);
      return NextResponse.json({ ok: true });
    }

    // Full edit: key / max_devices / expires_at / status
    if (body.edit === true || body.key !== undefined || body.max_devices !== undefined || body.expires_at !== undefined) {
      const result = await updateLicense(id, {
        key: typeof body.key === 'string' ? body.key : undefined,
        max_devices: typeof body.max_devices === 'number' ? body.max_devices : undefined,
        expires_at:
          body.expires_at === null || body.expires_at === ''
            ? null
            : typeof body.expires_at === 'string'
              ? body.expires_at
              : undefined,
        status: typeof body.status === 'string' ? body.status : undefined,
      });
      return NextResponse.json({ ok: true, id: result.id });
    }

    if (typeof body.status === 'string') {
      if (!['active', 'banned', 'expired'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      await updateLicenseStatus(id, body.status);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: 'Provide status, extend_days, features, reset_hwid, or edit fields' },
      { status: 400 }
    );
  } catch (e) {
    const msg = String(e);
    if (msg.includes('already exists')) {
      return NextResponse.json({ error: 'Key already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
