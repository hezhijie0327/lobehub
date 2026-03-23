import { nanoid } from 'nanoid';

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replaceAll('=', '')
    .replaceAll('+', '-')
    .replaceAll('/', '_');
}

function base64UrlJsonEncode(obj: Record<string, any>): string {
  const json = JSON.stringify(obj);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  return base64UrlEncode(data.buffer);
}

async function signJWT(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64UrlEncode(signature);
}

export async function createJWT(
  accessKey: string,
  secretKey: string,
  expiresIn: number = 1800,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    exp: now + expiresIn,
    iat: now,
    iss: accessKey,
    jti: nanoid(),
    nbf: now - 5,
  };

  const encodedHeader = base64UrlJsonEncode(header);
  const encodedPayload = base64UrlJsonEncode(payload);

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await signJWT(signatureInput, secretKey);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
