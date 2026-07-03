import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as postexService from '@/services/postexService';
import { GetAllOrdersQuerySchema } from '@/lib/schemas';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/orders/postex' });

export const GET = withPermission(
  'orders:postex-sync',
  async (req: NextRequest, _ctx: RouteContext, auth: JwtPayload) => {
    try {
      const parsed = GetAllOrdersQuerySchema.safeParse(
        Object.fromEntries(req.nextUrl.searchParams)
      );
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      log.info({ requestedBy: auth.sub, ...parsed.data }, 'GET /api/orders/postex');
      const orders = await postexService.getAllOrders(parsed.data);
      return NextResponse.json(orders);
    } catch (error) {
      log.error({ error }, 'GET /api/orders/postex failed');
      return handleError(error);
    }
  }
);
