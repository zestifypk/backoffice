import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError } from '@/lib/api-helpers';
import { SyncTrackingNumbersBodySchema } from '@/lib/schemas';
import * as orderService from '@/services/orderService';

export const runtime = 'nodejs';

export const POST = withPermission('orders:update', async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = SyncTrackingNumbersBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await orderService.syncTrackingNumbers(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
});
