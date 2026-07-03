import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import { ResetPasswordBodySchema } from '@/lib/schemas';
import * as userService from '@/services/userService';

export const runtime = 'nodejs';

export const PATCH = withPermission('users:reset-password', async (req: NextRequest, ctx: RouteContext) => {
  try {
    const { id } = await ctx.params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = ResetPasswordBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await userService.resetPassword(userId, parsed.data.newPassword);
    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (err) {
    return handleError(err);
  }
});
