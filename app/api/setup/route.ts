import { NextResponse } from 'next/server';
import { initDB } from '@/lib/db';

export async function POST() {
  try {
    await initDB();
    return NextResponse.json({ ok: true, message: 'Firebase RTDB initialized successfully' });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
