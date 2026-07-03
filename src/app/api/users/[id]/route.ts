import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as userService from '@/services/userService';
import { UpdateUserBodySchema } from '@/lib/schemas';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/users/[id]' });

export const GET = withPermission(
  'user_read',
  async (_req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
      }

      log.info({ requestedBy: auth.sub, userId }, 'GET /api/users/[id]');
      const user = await userService.getUserById(userId);
      return NextResponse.json(user);
    } catch (error) {
      log.error({ error }, 'GET /api/users/[id] failed');
      return handleError(error);
    }
  }
);

export const PUT = withPermission(
  'user_update',
  async (req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
      }

      const body = await req.json();
      const parsed = UpdateUserBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const data = parsed.data;
      if (
        data.name === undefined &&
        data.email === undefined &&
        data.status === undefined &&
        data.roles === undefined &&
        data.permissions === undefined
      ) {
        return NextResponse.json(
          { error: 'At least one field (name, email, status, roles, permissions) is required' },
          { status: 400 }
        );
      }

      log.info({ requestedBy: auth.sub, userId, fields: Object.keys(data) }, 'PUT /api/users/[id]');
      const user = await userService.updateUser(userId, data);

      log.info({ requestedBy: auth.sub, userId }, 'User updated');
      return NextResponse.json(user);
    } catch (error) {
      log.error({ error }, 'PUT /api/users/[id] failed');
      return handleError(error);
    }
  }
);

export const DELETE = withPermission(
  'user_delete',
  async (_req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { id } = await ctx.params;
      const userId = Number(id);
      if (!Number.isInteger(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
      }

      log.warn({ requestedBy: auth.sub, userId }, 'DELETE /api/users/[id] – hard delete');
      await userService.hardDeleteUser(userId);

      log.warn({ requestedBy: auth.sub, userId }, 'User permanently deleted');
      return NextResponse.json({ message: 'User permanently deleted' });
    } catch (error) {
      log.error({ error }, 'DELETE /api/users/[id] failed');
      return handleError(error);
    }
  }
);
