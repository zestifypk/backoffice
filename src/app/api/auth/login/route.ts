import { NextRequest, NextResponse } from 'next/server';
import * as authService from '@/services/authService';
import { LoginBodySchema } from '@/lib/schemas';
import { handleError } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await authService.login(parsed.data);

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
}
