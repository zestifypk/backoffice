import * as XLSX from 'xlsx';
import logger from '@/lib/logger';
import * as orderRepository from '@/repositories/orderRepository';
import type { Order } from '@/types';
import type { CreateOrderInput, UpdateOrderInput, SyncTrackingNumbersInput, SyncTrackingNumbersResult } from '@/lib/schemas';
import { CreateOrderBodySchema } from '@/lib/schemas';

const log = logger.child({ module: 'orderService' });

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listOrders(filters?: orderRepository.OrderFilters): Promise<Order[]> {
  log.info({ filters }, 'Listing orders');
  return orderRepository.listAll(filters);
}

export async function getOrderById(id: number): Promise<Order> {
  log.info({ orderId: id }, 'Fetching order');
  const order = await orderRepository.findById(id);
  if (!order) throw makeError('Order not found', 404);
  return order;
}

export async function createOrder(data: CreateOrderInput, createdBy: number): Promise<Order> {
  log.info({ reference: data.reference_number }, 'Creating order');
  const existing = await orderRepository.findByReference(data.reference_number);
  if (existing) throw makeError(`Order with reference "${data.reference_number}" already exists`, 409);
  const order = await orderRepository.create(data, createdBy);
  log.info({ orderId: order.id }, 'Order created');
  return order;
}

export async function updateOrder(id: number, data: UpdateOrderInput): Promise<Order> {
  log.info({ orderId: id }, 'Updating order');
  const existing = await orderRepository.findById(id);
  if (!existing) throw makeError('Order not found', 404);

  if (data.reference_number && data.reference_number !== existing.reference_number) {
    const taken = await orderRepository.findByReference(data.reference_number);
    if (taken) throw makeError(`Reference "${data.reference_number}" is already used by another order`, 409);
  }

  if (data.tracking_number && data.tracking_number !== existing.tracking_number) {
    const taken = await orderRepository.findByTrackingNumber(data.tracking_number);
    if (taken) throw makeError(`Tracking number "${data.tracking_number}" is already assigned to another order`, 409);
  }

  const updated = await orderRepository.update(id, data);
  if (!updated) throw makeError('Order not found', 404);
  log.info({ orderId: id }, 'Order updated');
  return updated;
}

export async function scanOrder(
  trackingNumber: string,
  status: 'delivered' | 'returned'
): Promise<Order> {
  log.info({ trackingNumber, status }, 'Scanning order');
  const order = await orderRepository.findByTrackingNumber(trackingNumber);
  if (!order) throw makeError(`No order found with tracking number "${trackingNumber}"`, 404);

  const updated = await orderRepository.update(order.id, { status });
  if (!updated) throw makeError('Order not found', 404);
  log.info({ orderId: order.id, status }, 'Order status updated via scan');
  return updated;
}

export async function syncTrackingNumbers(
  data: SyncTrackingNumbersInput
): Promise<SyncTrackingNumbersResult> {
  // Last occurrence wins if PostEx reports the same reference number twice in one fetch.
  const byReference = new Map(
    data.items.map((i) => [i.referenceNumber, { trackingNumber: i.trackingNumber, transactionStatus: i.transactionStatus }])
  );
  const items = [...byReference.entries()].map(([referenceNumber, v]) => ({
    referenceNumber,
    trackingNumber: v.trackingNumber,
    // Only "Delivered" flips the local status; every other PostEx status is left alone.
    status:
      data.syncStatus && v.transactionStatus?.trim().toLowerCase() === 'delivered'
        ? ('delivered' as const)
        : undefined,
  }));

  log.info({ total: items.length, syncStatus: data.syncStatus }, 'Syncing tracking numbers from PostEx');

  const existing = await orderRepository.findExistingReferences(items.map((i) => i.referenceNumber));
  const matchedItems = items.filter((i) => existing.has(i.referenceNumber));
  const notFound = items.filter((i) => !existing.has(i.referenceNumber)).map((i) => i.referenceNumber);
  const statusUpdated = matchedItems.filter((i) => i.status).length;

  let updated: number;
  try {
    updated = await orderRepository.bulkUpdateTrackingNumbers(matchedItems);
  } catch (error) {
    const dbError = error as { code?: string };
    if (dbError.code === 'ER_DUP_ENTRY') {
      throw makeError(
        'One or more tracking numbers are already assigned to a different order in the system',
        409
      );
    }
    throw error;
  }

  log.info(
    { total: items.length, matched: matchedItems.length, updated, statusUpdated, notFound: notFound.length },
    'Tracking number sync complete'
  );

  return { total: items.length, matched: matchedItems.length, updated, statusUpdated, notFound };
}

export async function deleteOrder(id: number): Promise<void> {
  log.info({ orderId: id }, 'Deleting order');
  const deleted = await orderRepository.remove(id);
  if (!deleted) throw makeError('Order not found', 404);
  log.info({ orderId: id }, 'Order deleted');
}

// PostEx template column indices (0-based, matches the sheet header row)
const COL = {
  reference_number:    0,
  order_amount:        1,
  order_detail:        2,
  customer_name:       3,
  customer_phone:      4,
  order_address:       5,
  city:                6,
  items:               7,
  airway_bill_copies:  8,
  notes:               9,
  address_code:        10,
  return_address_code: 11,
  order_type:          12,
  booking_weight:      13,
} as const;

export interface UploadResult {
  total: number;
  created: number;
  skipped: number;
  errors: { row: number; reference: string; reason: string }[];
}

export async function uploadOrders(fileBuffer: Buffer, createdBy: number): Promise<UploadResult> {
  log.info({ createdBy }, 'Uploading orders from Excel');

  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  // Row 0 is the header — skip it
  const dataRows = rows.slice(1).filter((r): r is unknown[] =>
    Array.isArray(r) && r.some((cell) => cell !== '' && cell !== null && cell !== undefined)
  );

  const result: UploadResult = { total: dataRows.length, created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowNum = i + 2; // 1-indexed, accounting for header

    const raw = {
      reference_number:    String(row[COL.reference_number] ?? '').trim(),
      order_amount:        Number(row[COL.order_amount] ?? 0),
      order_detail:        row[COL.order_detail] != null ? String(row[COL.order_detail]).trim() : undefined,
      customer_name:       String(row[COL.customer_name] ?? '').trim(),
      customer_phone:      String(row[COL.customer_phone] ?? '').trim(),
      order_address:       String(row[COL.order_address] ?? '').trim(),
      city:                String(row[COL.city] ?? '').trim(),
      items:               row[COL.items] != null ? Number(row[COL.items]) : undefined,
      airway_bill_copies:  row[COL.airway_bill_copies] != null ? Number(row[COL.airway_bill_copies]) : undefined,
      notes:               row[COL.notes] != null ? String(row[COL.notes]).trim() : undefined,
      address_code:        row[COL.address_code] != null ? String(row[COL.address_code]).trim() : undefined,
      return_address_code: row[COL.return_address_code] != null ? String(row[COL.return_address_code]).trim() : undefined,
      order_type:          row[COL.order_type] != null ? String(row[COL.order_type]).split('(')[0].trim() : undefined,
      booking_weight:      row[COL.booking_weight] != null ? Number(row[COL.booking_weight]) : undefined,
    };

    const parsed = CreateOrderBodySchema.safeParse(raw);
    if (!parsed.success) {
      result.errors.push({
        row: rowNum,
        reference: raw.reference_number || `row-${rowNum}`,
        reason: parsed.error.issues[0].message,
      });
      continue;
    }

    const inserted = await orderRepository.createIgnore(parsed.data, createdBy);
    if (inserted) result.created++;
    else result.skipped++;
  }

  log.info({ created: result.created, skipped: result.skipped, errors: result.errors.length }, 'Upload complete');
  return result;
}
