import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import type { JwtPayload } from '@/types';

export type RouteContext = { params: Promise<Record<string, string>> };

export type AuthedHandler = (
  req: NextRequest,
  ctx: RouteContext,
  auth: JwtPayload
) => Promise<NextResponse>;

export function getToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return req.cookies.get('auth_token')?.value ?? null;
}

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    const token = getToken(req);
    if (!token) return NextResponse.json({ error: 'Missing authentication' }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    return handler(req, ctx, payload);
  };
}

export function withPermission(permission: string, handler: AuthedHandler) {
  return withAuth(async (req, ctx, auth) => {
    if (!auth.permissions.includes(permission)) {
      return NextResponse.json({ error: 'Forbidden: missing permission' }, { status: 403 });
    }
    return handler(req, ctx, auth);
  });
}

export function handleError(error: unknown): NextResponse {
  const err = error as { statusCode?: number; message?: string };
  const status = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';
  return NextResponse.json({ error: message }, { status });
}
