import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  UserSchema,
  RoleSchema,
  PermissionSchema,
  ErrorSchema,
  LoginBodySchema,
  RegisterBodySchema,
  CreateUserBodySchema,
  UpdateUserBodySchema,
  ChangePasswordBodySchema,
  ResetPasswordBodySchema,
  OrderSchema,
  CreateOrderBodySchema,
  UpdateOrderBodySchema,
  GetAllOrdersQuerySchema,
  PostExOrderSchema,
} from '@/lib/schemas';

const registry = new OpenAPIRegistry();

// ── Security scheme ───────────────────────────────────────────────────────────

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT from POST /api/auth/login',
});

// ── Reusable response refs ────────────────────────────────────────────────────

const r401 = { description: 'Missing or invalid token', content: { 'application/json': { schema: ErrorSchema } } };
const r403 = { description: 'Authenticated but missing required permission', content: { 'application/json': { schema: ErrorSchema } } };
const r404 = { description: 'Resource not found', content: { 'application/json': { schema: ErrorSchema } } };

// ── Auth ──────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Register a new account',
  security: [],
  request: { body: { required: true, content: { 'application/json': { schema: RegisterBodySchema } } } },
  responses: {
    201: { description: 'User created', content: { 'application/json': { schema: UserSchema } } },
    409: { description: 'Email already in use', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Log in and receive a JWT',
  security: [],
  request: { body: { required: true, content: { 'application/json': { schema: LoginBodySchema } } } },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({ token: z.string(), user: UserSchema }),
        },
      },
    },
    401: { description: 'Invalid credentials', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  tags: ['Auth'],
  summary: 'Clear the auth cookie',
  responses: {
    200: {
      description: 'Logged out',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/auth/change-password',
  tags: ['Auth'],
  summary: 'Change own password',
  description: 'Authenticated user changes their own password. Requires the current password for verification.',
  request: { body: { required: true, content: { 'application/json': { schema: ChangePasswordBodySchema } } } },
  responses: {
    200: { description: 'Password changed', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    400: { description: 'Current password incorrect or validation error', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Get the currently authenticated user',
  responses: {
    200: { description: 'Current user', content: { 'application/json': { schema: UserSchema } } },
    401: r401,
  },
});

// ── Users ─────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags: ['Users'],
  summary: 'List all users',
  description: 'Requires permission: `user_read`',
  request: {
    query: z.object({
      includeDeleted: z
        .string()
        .optional()
        .openapi({ description: 'Pass "true" to include soft-deleted users', example: 'true' }),
    }),
  },
  responses: {
    200: {
      description: 'Array of users',
      content: { 'application/json': { schema: z.array(UserSchema) } },
    },
    401: r401,
    403: r403,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/users',
  tags: ['Users'],
  summary: 'Create a new user',
  description: 'Requires permission: `user_create`',
  request: { body: { required: true, content: { 'application/json': { schema: CreateUserBodySchema } } } },
  responses: {
    201: { description: 'User created', content: { 'application/json': { schema: UserSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
    409: { description: 'Email already in use', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Get a single user by ID',
  description: 'Requires permission: `user_read`',
  request: { params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }) },
  responses: {
    200: { description: 'User object', content: { 'application/json': { schema: UserSchema } } },
    401: r401,
    403: r403,
    404: r404,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Update user details, roles, and/or direct permissions',
  description:
    'Requires permission: `user_update`. All fields are optional; `roles` and `permissions` fully replace existing assignments when provided.',
  request: {
    params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }),
    body: { required: true, content: { 'application/json': { schema: UpdateUserBodySchema } } },
  },
  responses: {
    200: { description: 'Updated user', content: { 'application/json': { schema: UserSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
    404: r404,
    409: { description: 'Email already in use', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/users/{id}',
  tags: ['Users'],
  summary: 'Permanently delete a user (hard delete)',
  description: 'Requires permission: `user_delete`. Irreversible — removes the record from the database.',
  request: { params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }) },
  responses: {
    200: {
      description: 'Deletion confirmed',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: r401,
    403: r403,
    404: r404,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/users/{id}/deactivate',
  tags: ['Users'],
  summary: 'Soft-delete a user',
  description:
    'Requires permission: `user_update`. Sets `deleted_at`; the record stays in the database.',
  request: { params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }) },
  responses: {
    200: {
      description: 'User deactivated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: r401,
    403: r403,
    404: r404,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/users/{id}/reset-password',
  tags: ['Users'],
  summary: 'Reset a user\'s password (admin)',
  description: 'Requires permission: `users:reset-password`. No current password needed.',
  request: {
    params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }),
    body: { required: true, content: { 'application/json': { schema: ResetPasswordBodySchema } } },
  },
  responses: {
    200: { description: 'Password reset', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
    404: r404,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/users/{id}/roles',
  tags: ['Users'],
  summary: 'Append a single role to a user (legacy)',
  description:
    'Adds one role without removing existing assignments. Prefer PUT /api/users/{id} for full role replacement.',
  request: {
    params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }),
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({ roleName: z.string().openapi({ example: 'admin' }) }),
        },
      },
    },
  },
  responses: {
    200: { description: 'Role assigned' },
    400: { description: 'Missing roleName' },
    401: r401,
    403: r403,
    404: { description: 'Role not found' },
  },
});

// ── Orders ────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/orders',
  tags: ['Orders'],
  summary: 'List all orders',
  description: 'Requires permission: `orders:read`. Supports optional query filters.',
  request: {
    query: z.object({
      status:     z.string().optional().openapi({ example: 'pending', description: 'Filter by status' }),
      order_type: z.string().optional().openapi({ example: 'Normal', description: 'Filter by order type' }),
      city:       z.string().optional().openapi({ example: 'Lahore', description: 'Filter by city (partial match)' }),
    }),
  },
  responses: {
    200: { description: 'Array of orders', content: { 'application/json': { schema: z.array(OrderSchema) } } },
    401: r401,
    403: r403,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/orders',
  tags: ['Orders'],
  summary: 'Create a new order',
  description: 'Requires permission: `orders:create`.',
  request: { body: { required: true, content: { 'application/json': { schema: CreateOrderBodySchema } } } },
  responses: {
    201: { description: 'Order created', content: { 'application/json': { schema: OrderSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
    409: { description: 'Duplicate reference number', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  summary: 'Get a single order',
  description: 'Requires permission: `orders:read`.',
  request: { params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }) },
  responses: {
    200: { description: 'Order object', content: { 'application/json': { schema: OrderSchema } } },
    401: r401,
    403: r403,
    404: r404,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  summary: 'Update an order',
  description: 'Requires permission: `orders:update`. All fields optional.',
  request: {
    params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }),
    body: { required: true, content: { 'application/json': { schema: UpdateOrderBodySchema } } },
  },
  responses: {
    200: { description: 'Updated order', content: { 'application/json': { schema: OrderSchema } } },
    400: { description: 'Validation error', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
    404: r404,
    409: { description: 'Duplicate reference number', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/orders/{id}',
  tags: ['Orders'],
  summary: 'Delete an order',
  description: 'Requires permission: `orders:delete`.',
  request: { params: z.object({ id: z.coerce.number().int().openapi({ example: 1 }) }) },
  responses: {
    200: { description: 'Deleted', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
    401: r401,
    403: r403,
    404: r404,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/orders/upload',
  tags: ['Orders'],
  summary: 'Bulk upload orders from PostEx Excel template',
  description: 'Requires permission: `orders:create`. Send as `multipart/form-data` with a `file` field containing the `.xlsx` file. Duplicate reference numbers are skipped.',
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().openapi({ type: 'string', format: 'binary', description: 'PostEx .xlsx template file' }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Upload result',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            total:   z.number().int(),
            created: z.number().int(),
            skipped: z.number().int(),
            errors:  z.array(z.object({ row: z.number(), reference: z.string(), reason: z.string() })),
          }),
        },
      },
    },
    400: { description: 'No file or wrong file type', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/orders/postex',
  tags: ['Orders'],
  summary: 'Fetch orders from PostEx',
  description:
    'Requires permission: `orders:postex-sync`. Proxies PostEx\'s get-all-order endpoint — read-only, does not touch the local `orders` table.',
  request: { query: GetAllOrdersQuerySchema },
  responses: {
    200: {
      description: 'Array of orders reported by PostEx',
      content: { 'application/json': { schema: z.array(PostExOrderSchema) } },
    },
    400: { description: 'Invalid query params', content: { 'application/json': { schema: ErrorSchema } } },
    401: r401,
    403: r403,
    502: { description: 'PostEx API unreachable or returned an error', content: { 'application/json': { schema: ErrorSchema } } },
  },
});

// ── Access ────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/access/roles',
  tags: ['Access'],
  summary: 'List all roles',
  description: 'Requires permission: `roles:read`',
  responses: {
    200: {
      description: 'Array of roles',
      content: { 'application/json': { schema: z.array(RoleSchema) } },
    },
    401: r401,
    403: r403,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/access/permissions',
  tags: ['Access'],
  summary: 'List all permissions',
  description: 'Requires permission: `permissions:read`',
  responses: {
    200: {
      description: 'Array of permissions',
      content: { 'application/json': { schema: z.array(PermissionSchema) } },
    },
    401: r401,
    403: r403,
  },
});

// ── System ────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/health',
  tags: ['System'],
  summary: 'Health check',
  security: [],
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: z.object({
            status: z.string().openapi({ example: 'ok' }),
            timestamp: z.string().openapi({ format: 'date-time' }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/stats',
  tags: ['System'],
  summary: 'Dashboard statistics',
  responses: {
    200: { description: 'Stats object' },
    401: r401,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/activity',
  tags: ['System'],
  summary: 'Recent activity feed',
  responses: {
    200: { description: 'Activity array' },
    401: r401,
  },
});

// ── Generate spec ─────────────────────────────────────────────────────────────

const generator = new OpenApiGeneratorV3(registry.definitions);

const baseSpec = generator.generateDocument({
  openapi: '3.0.3',
  info: {
    title: 'Backoffice API',
    version: '1.0.0',
    description:
      'Internal backoffice API. Authenticate via POST /api/auth/login and paste the returned token into the Authorize button (Bearer scheme).',
  },
  servers: [{ url: process.env.NEXT_PUBLIC_API_URL ?? '', description: 'Current server' }],
});

export const swaggerSpec = {
  ...baseSpec,
  tags: [
    { name: 'Auth', description: 'Authentication endpoints (no permission required)' },
    { name: 'Users', description: 'User CRUD — requires UserManagement role' },
    { name: 'Orders', description: 'PostEx order management — create, list, update, delete, bulk upload' },
    { name: 'Access', description: 'Roles and permissions catalogue' },
    { name: 'System', description: 'Health, stats, activity' },
  ],
  security: [{ bearerAuth: [] }],
};
