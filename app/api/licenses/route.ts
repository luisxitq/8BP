import { NextRequest, NextResponse } from 'next/server';
  import { getAllLicenses, createLicense, getStats } from '@/lib/db';
  import { generateKey } from '@/lib/keygen';

  export async function GET() {
    try {
      const [licenses, stats] = await Promise.all([getAllLicenses(), getStats()]);
      return NextResponse.json({ licenses, stats });
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 });
    }
  }

  export async function POST(req: NextRequest) {
    try {
      const body = await req.json();
      const key = body.custom_key?.trim() || generateKey();
      const game_type = body.game_type ?? '8ball';
      const max_devices = Number(body.max_devices ?? 1);
      const note = body.note ?? '';
      const expires_at = body.expires_at ?? null;
      const features = Array.isArray(body.features) ? body.features.join(',') : (body.features ?? '');

      const license = await createLicense({ key, game_type, max_devices, note, expires_at, features });
      return NextResponse.json({ license }, { status: 201 });
    } catch (e: unknown) {
      const msg = String(e);
      if (msg.includes('unique') || msg.includes('duplicate')) {
        return NextResponse.json({ error: 'Key already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
  