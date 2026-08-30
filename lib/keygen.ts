const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function segment(len = 4): string {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export function generateKey(): string {
  return `LYN8BP-${segment(4)}-${segment(4)}`;
}

export function xorEncrypt(data: string, key: string): string {
  return Array.from(data)
    .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
    .join('');
}

export function xorDecrypt(data: string, key: string): string {
  return xorEncrypt(data, key);
}

export function base64Encode(data: string): string {
  return Buffer.from(data, 'binary').toString('base64');
}

export function base64Decode(data: string): string {
  return Buffer.from(data, 'base64').toString('binary');
}

export function encryptPayload(obj: object, key: string): string {
  const json = JSON.stringify(obj);
  const encrypted = xorEncrypt(json, key);
  return base64Encode(encrypted);
}

export function decryptPayload(encoded: string, key: string): object | null {
  try {
    const decoded = base64Decode(encoded);
    const decrypted = xorDecrypt(decoded, key);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
