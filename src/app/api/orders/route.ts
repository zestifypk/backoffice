import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import { CreateOrderBodySchema } from '@/lib/schemas';
import * as orderService from '@/services/orderService';
import type { OrderStatus, OrderType } from '@/types';

export const runtime = 'nodejs';

export const GET = withPermission('orders:read', async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const filters = {
      status:     (searchParams.get('status') as OrderStatus | null) ?? undefined,
      order_type: (searchParams.get('order_type') as OrderType | null) ?? undefined,
      city:       searchParams.get('city') ?? undefined,
    };
    const orders = await orderService.listOrders(filters);
    return NextResponse.json(orders);
  } catch (err) {
    return handleError(err);
  }
});

export const POST = withPermission('orders:create', async (req: NextRequest, _ctx: RouteContext, auth) => {
  try {
    const body = await req.json();
    const parsed = CreateOrderBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const order = await orderService.createOrder(parsed.data, auth.sub);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
});
