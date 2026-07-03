import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as userService from '@/services/userService';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/users/[id]/deactivate' });

/** Soft-deletes a user by setting deleted_at. The record stays in the DB. */
export const PUT = withPermission(
  'user_update',
  async (_req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
      }

      log.info({ requestedBy: auth.sub, userId }, 'PUT /api/users/[id]/deactivate – soft delete');
      await userService.softDeleteUser(userId);

      log.info({ requestedBy: auth.sub, userId }, 'User soft-deleted');
      return NextResponse.json({ message: 'User deactivated (soft-deleted)' });
    } catch (error) {
      log.error({ error }, 'PUT /api/users/[id]/deactivate failed');
      return handleError(error);
    }
  }
);
