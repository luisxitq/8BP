import { SignJWT, jwtVerify } from 'jose';
import { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } from './config';

const getSecret = () => new TextEncoder().encode(JWT_SECRET);

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export function checkAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
