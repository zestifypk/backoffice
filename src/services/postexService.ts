import { getEnv } from '@/lib/env';
import logger from '@/lib/logger';
import type { GetAllOrdersInput, PostExOrder, PostExTrackOrder } from '@/lib/schemas';

const log = logger.child({ module: 'postexService' });

const BASE_URL =
  process.env.POSTEX_API_BASE_URL ?? 'https://api.postex.pk/services/integration/api/order/v1';

interface PostExGetAllOrdersResponse {
  statusCode: string;
  statusMessage: string;
  dist: PostExOrder[] | null;
}

interface PostExTrackOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist: PostExTrackOrder | null;
}

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function getAllOrders(params: GetAllOrdersInput): Promise<PostExOrder[]> {
  const token = getEnv('POSTEX_API_TOKEN');

  const url = new URL(`${BASE_URL}/get-all-order`);
  url.searchParams.set('startDate', params.startDate);
  url.searchParams.set('endDate', params.endDate);
  url.searchParams.set('orderStatusId', String(params.orderStatusId));

  log.info(
    { startDate: params.startDate, endDate: params.endDate, orderStatusId: params.orderStatusId },
    'Fetching orders from PostEx'
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { token },
      cache: 'no-store',
    });
  } catch (error) {
    log.error({ error }, 'PostEx request failed');
    throw makeError('Failed to reach PostEx API', 502);
  }

  const body = (await res.json().catch(() => null)) as PostExGetAllOrdersResponse | null;

  if (!res.ok || !body || body.statusCode !== '200') {
    log.error({ status: res.status, body }, 'PostEx API returned an error');
    throw makeError(body?.statusMessage ?? 'PostEx API request failed', res.status >= 400 ? res.status : 502);
  }

  return body.dist ?? [];
}

export async function trackOrder(trackingNumber: string): Promise<PostExTrackOrder> {
  const token = getEnv('POSTEX_API_TOKEN');
  const url = `${BASE_URL}/track-order/${encodeURIComponent(trackingNumber)}`;

  log.info({ trackingNumber }, 'Tracking order via PostEx');

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { token },
      cache: 'no-store',
    });
  } catch (error) {
    log.error({ error }, 'PostEx request failed');
    throw makeError('Failed to reach PostEx API', 502);
  }

  const body = (await res.json().catch(() => null)) as PostExTrackOrderResponse | null;

  if (!res.ok || !body || body.statusCode !== '200') {
    log.error({ status: res.status, body }, 'PostEx API returned an error');
    throw makeError(body?.statusMessage ?? 'PostEx API request failed', res.status >= 400 ? res.status : 502);
  }

  if (!body.dist) throw makeError(`No tracking data found for "${trackingNumber}"`, 404);
  return body.dist;
}
