import { NextRequest, NextResponse } from 'next/server';
import { withPermission, handleError, type RouteContext } from '@/lib/api-helpers';
import * as orderService from '@/services/orderService';

export const runtime = 'nodejs';

// Increase body size limit for Excel uploads (default 4MB)
export const maxDuration = 30;

export const POST = withPermission('orders:create', async (req: NextRequest, _ctx: RouteContext, auth) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded. Send a multipart/form-data request with a "file" field.' }, { status: 400 });
    }

    const ext = file instanceof File ? file.name.split('.').pop()?.toLowerCase() : '';
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      return NextResponse.json({ error: 'Only .xlsx and .xls files are accepted.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await orderService.uploadOrders(buffer, auth.sub);

    return NextResponse.json({
      message: `Upload complete. ${result.created} created, ${result.skipped} skipped (duplicate reference).`,
      ...result,
    }, { status: result.created > 0 ? 201 : 200 });
  } catch (err) {
    return handleError(err);
  }
});
