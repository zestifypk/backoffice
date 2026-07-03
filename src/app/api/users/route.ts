import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as userService from '@/services/userService';
import { CreateUserBodySchema } from '@/lib/schemas';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/users' });

export const GET = withPermission(
  'user_read',
  async (req: NextRequest, _ctx: RouteContext, auth: JwtPayload) => {
    try {
      const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === 'true';
      log.info({ requestedBy: auth.sub, includeDeleted }, 'GET /api/users');
      const users = await userService.listUsers(includeDeleted);
      return NextResponse.json(users);
    } catch (error) {
      log.error({ error }, 'GET /api/users failed');
      return handleError(error);
    }
  }
);

export const POST = withPermission(
  'user_create',
  async (req: NextRequest, _ctx: RouteContext, auth: JwtPayload) => {
    try {
      const body = await req.json();
      const parsed = CreateUserBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const { name, email, password, status, roles, permissions } = parsed.data;
      log.info({ requestedBy: auth.sub, email }, 'POST /api/users – creating user');
      const user = await userService.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        status,
        roles,
        permissions,
      });

      log.info({ requestedBy: auth.sub, newUserId: user.id }, 'User created');
      return NextResponse.json(user, { status: 201 });
    } catch (error) {
      log.error({ error }, 'POST /api/users failed');
      return handleError(error);
    }
  }
);
