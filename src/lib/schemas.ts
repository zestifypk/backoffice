import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// ── Shared primitives ─────────────────────────────────────────────────────────

export const UserStatusSchema = z
  .enum(['Active', 'Inactive'])
  .openapi({ example: 'Active' });

// ── Response schemas (docs + type inference) ──────────────────────────────────

export const UserSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'Jane Doe' }),
    email: z.email().openapi({ example: 'jane@example.com' }),
    status: UserStatusSchema,
    joined: z.string().openapi({ format: 'date-time', example: '2024-01-01T00:00:00.000Z' }),
    deletedAt: z.string().nullable().optional().openapi({ format: 'date-time', example: null }),
    roles: z.array(z.string()).optional().openapi({ example: ['UserManagement'] }),
    permissions: z
      .array(z.string())
      .optional()
      .openapi({ example: ['user_read', 'user_create'] }),
  })
  .openapi('User');

export const RoleSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'UserManagement' }),
    description: z
      .string()
      .nullable()
      .openapi({ example: 'Full user lifecycle management' }),
  })
  .openapi('Role');

export const PermissionSchema = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    name: z.string().openapi({ example: 'user_read' }),
    description: z
      .string()
      .nullable()
      .openapi({ example: 'View user list and individual user details' }),
  })
  .openapi('Permission');

export const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'Forbidden: missing permission' }),
  })
  .openapi('Error');

// ── Request body schemas (runtime validation + docs) ──────────────────────────

export const LoginBodySchema = z
  .object({
    email: z.email().openapi({ example: 'admin@example.com' }),
    password: z.string().min(1).openapi({ example: 'Admin@12345' }),
  })
  .openapi('LoginBody');

export const RegisterBodySchema = z
  .object({
    name: z.string().min(1, 'name is required').openapi({ example: 'Jane Doe' }),
    email: z.email('A valid email is required').openapi({ example: 'jane@example.com' }),
    password: z
      .string()
      .min(8, 'password must be at least 8 characters')
      .openapi({ example: 'Secret@123' }),
  })
  .openapi('RegisterBody');

export const CreateUserBodySchema = z
  .object({
    name: z.string().min(1, 'name is required').openapi({ example: 'Jane Doe' }),
    email: z.email('A valid email is required').openapi({ example: 'jane@example.com' }),
    password: z
      .string()
      .min(8, 'password must be at least 8 characters')
      .openapi({ example: 'Secret@123' }),
    status: UserStatusSchema.optional(),
    roles: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['UserManagement'],
        description: 'Role names to assign. Defaults to the "user" role if omitted.',
      }),
    permissions: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['user_read'],
        description: 'Permission names to grant directly (bypasses role hierarchy).',
      }),
  })
  .openapi('CreateUserBody');

export const UpdateUserBodySchema = z
  .object({
    name: z.string().min(1).optional().openapi({ example: 'Jane Updated' }),
    email: z.email('A valid email is required').optional().openapi({ example: 'new@example.com' }),
    status: UserStatusSchema.optional(),
    roles: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['admin'],
        description: 'Replaces all current role assignments when provided.',
      }),
    permissions: z
      .array(z.string())
      .optional()
      .openapi({
        example: ['user_read', 'user_update'],
        description: 'Replaces all direct permission assignments when provided.',
      }),
  })
  .openapi('UpdateUserBody');

export const ChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').openapi({ example: 'OldPass@123' }),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').openapi({ example: 'NewPass@456' }),
  })
  .openapi('ChangePasswordBody');

export const ResetPasswordBodySchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters').openapi({ example: 'Reset@12345' }),
  })
  .openapi('ResetPasswordBody');

// ── Orders ────────────────────────────────────────────────────────────────────

export const OrderTypeSchema = z
  .enum(['Normal', 'Reversed', 'Replacement', 'Overland'])
  .openapi({ example: 'Normal' });

export const OrderStatusSchema = z
  .enum(['pending', 'booked', 'in_transit', 'delivered', 'returned', 'cancelled'])
  .openapi({ example: 'pending' });

export const OrderSchema = z
  .object({
    id:                  z.number().int().openapi({ example: 1 }),
    reference_number:    z.string().openapi({ example: 'MAT16' }),
    order_amount:        z.number().openapi({ example: 599 }),
    order_detail:        z.string().nullable().openapi({ example: 'MOBILE MAT' }),
    customer_name:       z.string().openapi({ example: 'Abid Hussain' }),
    customer_phone:      z.string().openapi({ example: '00300440809' }),
    order_address:       z.string().openapi({ example: 'House No. 39, Street No. 16, Mehmood Booti, Lahore' }),
    city:                z.string().openapi({ example: 'Lahore' }),
    items:               z.number().int().openapi({ example: 1 }),
    airway_bill_copies:  z.number().int().openapi({ example: 1 }),
    notes:               z.string().nullable().openapi({ example: 'CALL PLEASE' }),
    address_code:        z.string().nullable().openapi({ example: '1' }),
    return_address_code: z.string().nullable().openapi({ example: '1' }),
    order_type:          OrderTypeSchema,
    booking_weight:      z.number().nullable().openapi({ example: 0.2 }),
    status:              OrderStatusSchema,
    created_by:          z.number().nullable().openapi({ example: 1 }),
    created_at:          z.string().openapi({ format: 'date-time' }),
    updated_at:          z.string().openapi({ format: 'date-time' }),
  })
  .openapi('Order');

export const CreateOrderBodySchema = z
  .object({
    reference_number:    z.string().min(1, 'reference_number is required').openapi({ example: 'MAT16' }),
    order_amount:        z.number({ error: 'order_amount must be a number' }).min(0).openapi({ example: 599 }),
    order_detail:        z.string().optional().openapi({ example: 'MOBILE MAT' }),
    customer_name:       z.string().min(1, 'customer_name is required').openapi({ example: 'Abid Hussain' }),
    customer_phone:      z.string().min(1, 'customer_phone is required').openapi({ example: '00300440809' }),
    order_address:       z.string().min(1, 'order_address is required').openapi({ example: 'House No. 39, Street No. 16, Mehmood Booti' }),
    city:                z.string().min(1, 'city is required').openapi({ example: 'Lahore' }),
    items:               z.number().int().min(1).optional().default(1).openapi({ example: 1 }),
    airway_bill_copies:  z.number().int().min(1).optional().default(1).openapi({ example: 1 }),
    notes:               z.string().optional().openapi({ example: 'CALL PLEASE' }),
    address_code:        z.string().optional().openapi({ example: '1' }),
    return_address_code: z.string().optional().openapi({ example: '1' }),
    order_type:          OrderTypeSchema.optional().default('Normal'),
    booking_weight:      z.number().min(0).optional().openapi({ example: 0.2 }),
  })
  .openapi('CreateOrderBody');

export const UpdateOrderBodySchema = z
  .object({
    reference_number:    z.string().min(1).optional().openapi({ example: 'MAT16-B' }),
    order_amount:        z.number().min(0).optional().openapi({ example: 650 }),
    order_detail:        z.string().optional().openapi({ example: 'MOBILE MAT' }),
    customer_name:       z.string().min(1).optional().openapi({ example: 'Abid Hussain' }),
    customer_phone:      z.string().min(1).optional().openapi({ example: '00300440809' }),
    order_address:       z.string().min(1).optional().openapi({ example: 'House No. 39, Street No. 16' }),
    city:                z.string().min(1).optional().openapi({ example: 'Lahore' }),
    items:               z.number().int().min(1).optional().openapi({ example: 1 }),
    airway_bill_copies:  z.number().int().min(1).optional().openapi({ example: 1 }),
    notes:               z.string().optional().openapi({ example: 'CALL PLEASE' }),
    address_code:        z.string().optional().openapi({ example: '1' }),
    return_address_code: z.string().optional().openapi({ example: '1' }),
    order_type:          OrderTypeSchema.optional(),
    booking_weight:      z.number().min(0).optional().openapi({ example: 0.2 }),
    status:              OrderStatusSchema.optional(),
  })
  .openapi('UpdateOrderBody');

// ── PostEx order sync (remote fetch, not the local `orders` table) ────────────

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const GetAllOrdersQuerySchema = z
  .object({
    startDate: isoDate.openapi({ example: '2026-07-01' }),
    endDate: isoDate.openapi({ example: '2026-07-03' }),
    orderStatusId: z.coerce
      .number()
      .int()
      .min(0)
      .max(18)
      .openapi({ example: 0, description: '0 = all statuses' }),
  })
  .openapi('GetAllOrdersQuery');

export const PostExOrderSchema = z
  .object({
    customerName: z.string().openapi({ example: 'Abid Hussain' }),
    customerPhone: z.string().openapi({ example: '03004408092' }),
    deliveryAddress: z.string().openapi({ example: 'House No. 39, Street No. 16, Mehmood Booti, Lahore' }),
    invoicePayment: z.number().openapi({ example: 599 }),
    orderDetail: z.string().openapi({ example: 'MOBILE MAT' }),
    orderRefNumber: z.string().openapi({ example: 'MAT16' }),
    transactionTax: z.number().openapi({ example: 0 }),
    transactionFee: z.number().openapi({ example: 0 }),
    trackingNumber: z.string().openapi({ example: '27425770000799' }),
    transactionDate: z.string().openapi({ example: '2026-07-03T00:03:52.000+0500' }),
    upfrontPayment: z.number().openapi({ example: 0 }),
    merchantName: z.string().openapi({ example: 'Zestify' }),
    transactionStatus: z.string().openapi({ example: 'Booked' }),
    reversalTax: z.number().openapi({ example: 0 }),
    reversalFee: z.number().openapi({ example: 0 }),
    cityName: z.string().openapi({ example: 'Lahore' }),
    pickupAddress: z.string().openapi({ example: '5th Floor Zohra Heights Gulberg Main Market Lahore' }),
    transactionNotes: z.string().nullable().optional().openapi({ example: 'CALL PLEASE' }),
    reservePayment: z.number().openapi({ example: 0 }),
    balancePayment: z.number().openapi({ example: 0 }),
    bookingWeight: z.number().openapi({ example: 0.2 }),
    items: z.number().int().openapi({ example: 1 }),
    invoiceDivision: z.number().int().openapi({ example: 1 }),
    returnAddress: z.string().openapi({ example: '5th Floor Zohra Heights Gulberg Main Market Lahore' }),
  })
  .openapi('PostExOrder');

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type CreateUserInput   = z.infer<typeof CreateUserBodySchema>;
export type UpdateUserInput   = z.infer<typeof UpdateUserBodySchema>;
export type LoginInput        = z.infer<typeof LoginBodySchema>;
export type RegisterInput     = z.infer<typeof RegisterBodySchema>;
export type CreateOrderInput  = z.infer<typeof CreateOrderBodySchema>;
export type UpdateOrderInput  = z.infer<typeof UpdateOrderBodySchema>;
export type GetAllOrdersInput = z.infer<typeof GetAllOrdersQuerySchema>;
export type PostExOrder       = z.infer<typeof PostExOrderSchema>;
