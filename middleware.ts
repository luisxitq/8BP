import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from './lib/config';

const PUBLIC_PATHS = ['/login', '/api/validate', '/api/setup', '/api/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const secret = new TextEncoder().encode(JWT_SECRET);

  if (pathname.startsWith('/api/')) {
    const token = req.cookies.get('kz_admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  }

  const token = req.cookies.get('kz_admin_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
