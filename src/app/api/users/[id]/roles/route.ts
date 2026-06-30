import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as userService from '@/services/userService';
import type { JwtPayload } from '@/types';

export const PATCH = withPermission(
  'users:assign-role',
  async (req: NextRequest, ctx: RouteContext, _auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      const { roleName } = await req.json();

      if (!userId || !roleName) {
        return NextResponse.json({ error: 'userId and roleName are required' }, { status: 400 });
      }

      const result = await userService.assignRole({ userId, roleName });
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  }
);
