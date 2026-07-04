import { pool } from '@/lib/db';
import type { Order, OrderStatus, OrderType } from '@/types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import type { CreateOrderInput, UpdateOrderInput } from '@/lib/schemas';

interface OrderRow extends RowDataPacket {
  id: number;
  reference_number: string;
  order_amount: string;
  order_detail: string | null;
  customer_name: string;
  customer_phone: string;
  order_address: string;
  city: string;
  items: number;
  airway_bill_copies: number;
  notes: string | null;
  address_code: string | null;
  return_address_code: string | null;
  order_type: OrderType;
  booking_weight: string | null;
  tracking_number: string | null;
  status: OrderStatus;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    reference_number: row.reference_number,
    order_amount: Number(row.order_amount),
    order_detail: row.order_detail,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    order_address: row.order_address,
    city: row.city,
    items: row.items,
    airway_bill_copies: row.airway_bill_copies,
    notes: row.notes,
    address_code: row.address_code,
    return_address_code: row.return_address_code,
    order_type: row.order_type,
    booking_weight: row.booking_weight !== null ? Number(row.booking_weight) : null,
    tracking_number: row.tracking_number,
    status: row.status,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface OrderFilters {
  status?: OrderStatus;
  order_type?: OrderType;
  city?: string;
}

export async function listAll(filters: OrderFilters = {}): Promise<Order[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }
  if (filters.order_type) {
    conditions.push('order_type = ?');
    values.push(filters.order_type);
  }
  if (filters.city) {
    conditions.push('city LIKE ?');
    values.push(`%${filters.city}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.execute<OrderRow[]>(
    `SELECT * FROM orders ${where} ORDER BY id DESC`,
    values as string[]
  );
  return rows.map(mapOrder);
}

export async function findById(id: number): Promise<Order | null> {
  const [rows] = await pool.execute<OrderRow[]>(
    'SELECT * FROM orders WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function findByReference(referenceNumber: string): Promise<Order | null> {
  const [rows] = await pool.execute<OrderRow[]>(
    'SELECT * FROM orders WHERE reference_number = ? LIMIT 1',
    [referenceNumber]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function findByTrackingNumber(trackingNumber: string): Promise<Order | null> {
  const [rows] = await pool.execute<OrderRow[]>(
    'SELECT * FROM orders WHERE tracking_number = ? LIMIT 1',
    [trackingNumber]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function create(data: CreateOrderInput, createdBy: number): Promise<Order> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO orders
      (reference_number, order_amount, order_detail, customer_name, customer_phone,
       order_address, city, items, airway_bill_copies, notes, address_code,
       return_address_code, order_type, booking_weight, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.reference_number,
      data.order_amount,
      data.order_detail ?? null,
      data.customer_name,
      data.customer_phone,
      data.order_address,
      data.city,
      data.items ?? 1,
      data.airway_bill_copies ?? 1,
      data.notes ?? null,
      data.address_code ?? null,
      data.return_address_code ?? null,
      data.order_type ?? 'Normal',
      data.booking_weight ?? null,
      createdBy,
    ]
  );
  const order = await findById(result.insertId);
  if (!order) throw new Error('Failed to create order');
  return order;
}

export async function createIgnore(data: CreateOrderInput, createdBy: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT IGNORE INTO orders
      (reference_number, order_amount, order_detail, customer_name, customer_phone,
       order_address, city, items, airway_bill_copies, notes, address_code,
       return_address_code, order_type, booking_weight, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.reference_number,
      data.order_amount,
      data.order_detail ?? null,
      data.customer_name,
      data.customer_phone,
      data.order_address,
      data.city,
      data.items ?? 1,
      data.airway_bill_copies ?? 1,
      data.notes ?? null,
      data.address_code ?? null,
      data.return_address_code ?? null,
      data.order_type ?? 'Normal',
      data.booking_weight ?? null,
      createdBy,
    ]
  );
  return result.affectedRows > 0;
}

export async function update(id: number, data: UpdateOrderInput): Promise<Order | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  const fieldMap: Record<string, unknown> = {
    reference_number:    data.reference_number,
    order_amount:        data.order_amount,
    order_detail:        data.order_detail,
    customer_name:       data.customer_name,
    customer_phone:      data.customer_phone,
    order_address:       data.order_address,
    city:                data.city,
    items:               data.items,
    airway_bill_copies:  data.airway_bill_copies,
    notes:               data.notes,
    address_code:        data.address_code,
    return_address_code: data.return_address_code,
    order_type:          data.order_type,
    booking_weight:      data.booking_weight,
    tracking_number:     data.tracking_number,
    status:              data.status,
  };

  for (const [col, val] of Object.entries(fieldMap)) {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return findById(id);

  values.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`,
    values as string[]
  );
  return findById(id);
}

export async function remove(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM orders WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

export async function findExistingReferences(referenceNumbers: string[]): Promise<Set<string>> {
  if (referenceNumbers.length === 0) return new Set();
  const placeholders = referenceNumbers.map(() => '?').join(', ');
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT reference_number FROM orders WHERE reference_number IN (${placeholders})`,
    referenceNumbers
  );
  return new Set(rows.map((r) => r.reference_number as string));
}

export async function bulkUpdateTrackingNumbers(
  items: { referenceNumber: string; trackingNumber: string }[]
): Promise<number> {
  if (items.length === 0) return 0;

  const caseClauses = items.map(() => 'WHEN ? THEN ?').join(' ');
  const caseValues = items.flatMap((i) => [i.referenceNumber, i.trackingNumber]);
  const referenceNumbers = items.map((i) => i.referenceNumber);
  const placeholders = referenceNumbers.map(() => '?').join(', ');

  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE orders
     SET tracking_number = CASE reference_number ${caseClauses} END
     WHERE reference_number IN (${placeholders})`,
    [...caseValues, ...referenceNumbers]
  );
  return result.affectedRows;
}
