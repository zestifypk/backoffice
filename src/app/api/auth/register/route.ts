import { NextRequest, NextResponse } from 'next/server';
import * as authService from '@/services/authService';
import { RegisterBodySchema } from '@/lib/schemas';
import { handleError } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await authService.register(parsed.data);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
