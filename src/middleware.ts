import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// Routes that don't require authentication
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/favicon'];
const PUBLIC_EXACT = ['/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
