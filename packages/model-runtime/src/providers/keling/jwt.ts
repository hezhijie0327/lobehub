import { createHmac, randomUUID } from 'node:crypto';

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64url').replaceAll('=', '');
}

function base64UrlJsonEncode(obj: Record<string, any>): string {
  const json = JSON.stringify(obj);
  return base64UrlEncode(Buffer.from(json, 'utf-8'));
}

export function createJWT(accessKey: string, secretKey: string, expiresIn: number = 1800): string {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    exp: now + expiresIn,
    iat: now,
    iss: accessKey,
    jti: randomUUID(),
    nbf: now - 5,
  };

  const encodedHeader = base64UrlJsonEncode(header);
  const encodedPayload = base64UrlJsonEncode(payload);

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secretKey).update(signatureInput).digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJWT(token: string, secretKey: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac('sha256', secretKey)
      .update(signatureInput)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, payload };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
