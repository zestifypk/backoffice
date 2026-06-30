import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as permissionRepository from '@/repositories/permissionRepository';
import type { JwtPayload } from '@/types';

export const GET = withPermission(
  'permissions:read',
  async (_req: NextRequest, _ctx: RouteContext, _auth: JwtPayload) => {
    try {
      console.log("test");
      const permissions = await permissionRepository.listPermissions();
      return NextResponse.json(permissions);
    } catch (error) {
      return handleError(error);
    }
  }
);
