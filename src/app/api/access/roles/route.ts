import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as roleRepository from '@/repositories/roleRepository';
import type { JwtPayload } from '@/types';

export const GET = withPermission(
  'roles:read',
  async (_req: NextRequest, _ctx: RouteContext, _auth: JwtPayload) => {
    try {
      const roles = await roleRepository.listRoles();
      return NextResponse.json(roles);
    } catch (error) {
      return handleError(error);
    }
  }
);
