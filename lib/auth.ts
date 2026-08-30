import { SignJWT, jwtVerify } from 'jose';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET ?? 'fallback_secret_32chars_minimum!!');

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
  const adminUser = process.env.ADMIN_USERNAME ?? 'admin';
  const adminPass = process.env.ADMIN_PASSWORD ?? 'change_me';
  return username === adminUser && password === adminPass;
}
