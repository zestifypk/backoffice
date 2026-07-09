import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import { AssignPermissionsBodySchema } from '@/lib/schemas';
import * as userService from '@/services/userService';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/users/[id]/permissions' });

export const PATCH = withPermission(
  'users:assign-permission',
  async (req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
      }

      const body = await req.json();
      const parsed = AssignPermissionsBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      log.info(
        { requestedBy: auth.sub, userId, permissions: parsed.data.permissions },
        'PATCH /api/users/:id/permissions'
      );
      const user = await userService.assignPermissionsToUser(userId, parsed.data);
      return NextResponse.json(user);
    } catch (error) {
      log.error({ error }, 'PATCH /api/users/:id/permissions failed');
      return handleError(error);
    }
  }
);
