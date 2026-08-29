import { NextRequest, NextResponse } from 'next/server';
import { checkAdminCredentials, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!checkAdminCredentials(username, password)) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('kz_admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12,
    path: '/',
  });
  return res;
}
