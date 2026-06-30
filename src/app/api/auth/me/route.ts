import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleError, type RouteContext } from '@/lib/api-helpers';
import * as authService from '@/services/authService';
import type { JwtPayload } from '@/types';

export const GET = withAuth(async (_req: NextRequest, _ctx: RouteContext, auth: JwtPayload) => {
  try {
    const user = await authService.getCurrentUser(auth.sub);
    return NextResponse.json(user);
  } catch (error) {
    return handleError(error);
  }
});
