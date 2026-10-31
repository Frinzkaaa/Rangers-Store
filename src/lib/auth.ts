export type UserRole = 'owner' | 'kasir';

export interface StoreUser {
  username: string;
  name: string;
  role: UserRole;
  pin: string;
  password?: string;
}

export interface UserSession {
  username: string;
  name: string;
  role: UserRole;
  exp: number;
}

export const STORE_USERS: StoreUser[] = [
  {
    username: 'owner',
    name: 'Owner Rangers',
    role: 'owner',
    pin: '8888',
    password: 'rangers123',
  },
  {
    username: 'kasir',
    name: 'Kasir Rangers',
    role: 'kasir',
    pin: '1234',
    password: 'kasir123',
  },
];

export const AUTH_COOKIE_NAME = 'rangers_session';

const DEFAULT_SECRET = 'rangers-store-secret-key-thrifts-2026';

function getSecretKey(): string {
  return process.env.AUTH_SECRET || DEFAULT_SECRET;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyData = enc.encode(getSecretKey());
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64url');
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64(base64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64url').toString('utf8');
  }
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function authenticateUser(identifier: string, secret: string): StoreUser | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanSecret = secret.trim();

  const user = STORE_USERS.find(
    (u) => u.username.toLowerCase() === cleanId
  );

  if (!user) return null;

  if (user.pin === cleanSecret || (user.password && user.password === cleanSecret)) {
    return user;
  }

  return null;
}

export async function signSessionToken(
  sessionData: Omit<UserSession, 'exp'>,
  expiresInSec: number = 7 * 24 * 3600 // 7 days
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const session: UserSession = {
    ...sessionData,
    exp,
  };

  const payloadStr = JSON.stringify(session);
  const payloadB64 = toBase64(payloadStr);

  const enc = new TextEncoder();
  const dataToSign = enc.encode(payloadB64);

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataToSign);
  const signatureHex = bufferToHex(signatureBuffer);

  return `${payloadB64}.${signatureHex}`;
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureHex] = parts;
  if (!payloadB64 || !signatureHex) return null;

  try {
    const enc = new TextEncoder();
    const dataToVerify = enc.encode(payloadB64);
    const signatureBytes = hexToUint8Array(signatureHex);

    const key = await getCryptoKey();
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataToVerify);

    if (!isValid) return null;

    const sessionJson = fromBase64(payloadB64);
    const session: UserSession = JSON.parse(sessionJson);

    // Check expiration
    const nowSec = Math.floor(Date.now() / 1000);
    if (session.exp && session.exp < nowSec) {
      return null;
    }

    return session;
  } catch (err) {
    return null;
  }
}
