import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { JwtPayload } from '@/types';

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me');
}

export async function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? '1h')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/** Reads and verifies the auth cookie from a Server Component / layout. */
export async function getServerAuth(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return token ? verifyToken(token) : null;
}
