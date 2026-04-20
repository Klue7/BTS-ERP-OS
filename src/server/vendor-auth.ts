import crypto from 'node:crypto';
import type { IncomingHttpHeaders } from 'node:http';

const SESSION_COOKIE = 'bts_supplier_session';
const DOWNLOAD_SECRET = process.env.VENDOR_DOCUMENT_SECRET || 'bts-vendor-doc-secret';

function toBase64Url(buffer: Buffer) {
  return buffer.toString('base64url');
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key as Buffer);
    });
  });

  return `${toBase64Url(salt)}.${toBase64Url(derivedKey)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltB64, hashB64] = storedHash.split('.');

  if (!saltB64 || !hashB64) {
    return false;
  }

  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, expected.length, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key as Buffer);
    });
  });

  return crypto.timingSafeEqual(expected, actual);
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionCookie(token: string, expiresAt: Date) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Expires=${new Date(0).toUTCString()}`;
}

export function readSessionToken(headers: IncomingHttpHeaders) {
  const cookieHeader = headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const [key, value] = part.trim().split('=');

    if (key === SESSION_COOKIE) {
      return value ?? null;
    }
  }

  return null;
}

export function createSignedDocumentToken(documentId: string, expiresAt: Date) {
  const payload = `${documentId}.${expiresAt.getTime()}`;
  const signature = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function verifySignedDocumentToken(token: string, documentId: string) {
  const [tokenDocumentId, expiresAtMs, signature] = token.split('.');

  if (!tokenDocumentId || !expiresAtMs || !signature || tokenDocumentId !== documentId) {
    return false;
  }

  const expiresAt = Number(expiresAtMs);

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const payload = `${tokenDocumentId}.${expiresAtMs}`;
  const expectedSignature = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const actualBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
