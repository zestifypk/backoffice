import { NextRequest, NextResponse } from 'next/server';
import * as authService from '@/services/authService';
import { handleError } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const result = await authService.login({ email, password });

    const response = NextResponse.json(result);
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}I w
