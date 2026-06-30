import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as userService from '@/services/userService';
import type { JwtPayload } from '@/types';

export const GET = withPermission(
  'users:read',
  async (_req: NextRequest, _ctx: RouteContext, _auth: JwtPayload) => {
    try {
      const users = await userService.listUsers();
      return NextResponse.json(users);
    } catch (error) {
      return handleError(error);
    }
  }
);
