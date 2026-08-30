import { NextRequest, NextResponse } from 'next/server';
  import { deleteLicense, updateLicenseStatus, extendLicense, resetLicenseHwid, updateLicenseFeatures } from '@/lib/db';

  export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
      await deleteLicense(Number(params.id));
      return NextResponse.json({ ok: true });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const body = await req.json();
      const id = Number(params.id);

      // Reset HWID
      if (body.reset_hwid === true) {
        await resetLicenseHwid(id);
        return NextResponse.json({ ok: true });
      }

      // Update features
      if (typeof body.features === 'string') {
        await updateLicenseFeatures(id, body.features);
        return NextResponse.json({ ok: true });
      }

      // Extend expiry by N days
      if (typeof body.extend_days === 'number') {
        const days = Math.floor(body.extend_days);
        if (days < 1 || days > 3650) {
          return NextResponse.json({ error: 'extend_days must be 1–3650' }, { status: 400 });
        }
        await extendLicense(id, days);
        return NextResponse.json({ ok: true });
      }

      // Change status
      if (typeof body.status === 'string') {
        if (!['active', 'banned', 'expired'].includes(body.status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        await updateLicenseStatus(id, body.status);
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ error: 'Provide status, extend_days, features, or reset_hwid' }, { status: 400 });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }
  