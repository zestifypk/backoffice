import { NextRequest, NextResponse } from 'next/server';
import * as authService from '@/services/authService';
import { handleError } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'name, email and password are required' },
        { status: 400 }
      );
    }

    const user = await authService.register({ name, email, password });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
