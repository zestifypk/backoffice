import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as userService from '@/services/userService';
import { UpdateUserStatusBodySchema } from '@/lib/schemas';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/users/[id]/status' });

/** Activates/deactivates a user. A reason is mandatory and kept in user_status_changes. */
export const PATCH = withPermission(
  'users:update',
  async (req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
      }

      const body = await req.json();
      const parsed = UpdateUserStatusBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      log.info(
        { requestedBy: auth.sub, userId, status: parsed.data.status },
        'PATCH /api/users/[id]/status'
      );
      const user = await userService.setUserStatus(userId, parsed.data.status, parsed.data.reason, auth.sub);

      log.info({ requestedBy: auth.sub, userId }, 'User status changed');
      return NextResponse.json(user);
    } catch (error) {
      log.error({ error }, 'PATCH /api/users/[id]/status failed');
      return handleError(error);
    }
  }
);
