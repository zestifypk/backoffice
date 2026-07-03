import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import { UpdateOrderBodySchema } from '@/lib/schemas';
import * as orderService from '@/services/orderService';

export const runtime = 'nodejs';

export const GET = withPermission('orders:read', async (_req: NextRequest, ctx: RouteContext) => {
  try {
    const { id } = await ctx.params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    const order = await orderService.getOrderById(orderId);
    return NextResponse.json(order);
  } catch (err) {
    return handleError(err);
  }
});

export const PATCH = withPermission('orders:update', async (req: NextRequest, ctx: RouteContext) => {
  try {
    const { id } = await ctx.params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateOrderBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const order = await orderService.updateOrder(orderId, parsed.data);
    return NextResponse.json(order);
  } catch (err) {
    return handleError(err);
  }
});

export const DELETE = withPermission('orders:delete', async (_req: NextRequest, ctx: RouteContext) => {
  try {
    const { id } = await ctx.params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    await orderService.deleteOrder(orderId);
    return NextResponse.json({ message: 'Order deleted' });
  } catch (err) {
    return handleError(err);
  }
});
