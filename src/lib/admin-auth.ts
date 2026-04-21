import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const ALG = 'HS256';
const EXPIRY = '8h';

export interface AdminTokenPayload extends JWTPayload {
  role: 'admin';
}

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(secret: string): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey(secret));
}

export async function verifyAdminToken(
  token: string,
  secret: string
): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if ((payload as AdminTokenPayload).role !== 'admin') return null;
    return payload as AdminTokenPayload;
  } catch {
    return null;
  }
}
