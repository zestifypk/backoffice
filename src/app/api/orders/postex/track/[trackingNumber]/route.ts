import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as postexService from '@/services/postexService';
import type { JwtPayload } from '@/types';
import logger from '@/lib/logger';

const log = logger.child({ module: 'api/orders/postex/track' });

export const GET = withPermission(
  'orders:postex-sync',
  async (_req: NextRequest, ctx: RouteContext, auth: JwtPayload) => {
    try {
      const { trackingNumber } = await ctx.params;
      log.info({ requestedBy: auth.sub, trackingNumber }, 'GET /api/orders/postex/track/:trackingNumber');
      const result = await postexService.trackOrder(trackingNumber);
      return NextResponse.json(result);
    } catch (error) {
      log.error({ error }, 'GET /api/orders/postex/track/:trackingNumber failed');
      return handleError(error);
    }
  }
);
