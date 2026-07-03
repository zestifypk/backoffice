import { NextRequest, NextResponse } from 'next/server';
import { withAuth, handleError, type RouteContext } from '@/lib/api-helpers';
import { ChangePasswordBodySchema } from '@/lib/schemas';
import * as userService from '@/services/userService';

export const runtime = 'nodejs';

export const PATCH = withAuth(async (req: NextRequest, _ctx: RouteContext, auth) => {
  try {
    const body = await req.json();
    const parsed = ChangePasswordBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    await userService.changePassword(auth.sub, parsed.data.currentPassword, parsed.data.newPassword);
    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (err) {
    return handleError(err);
  }
});
