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
    email: z.string().email().openapi({ example: 'jane@example.com' }),
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
    email: z.string().email().openapi({ example: 'admin@example.com' }),
    password: z.string().min(1).openapi({ example: 'Admin@12345' }),
  })
  .openapi('LoginBody');

export const RegisterBodySchema = z
  .object({
    name: z.string().min(1, 'name is required').openapi({ example: 'Jane Doe' }),
    email: z.string().email('A valid email is required').openapi({ example: 'jane@example.com' }),
    password: z
      .string()
      .min(8, 'password must be at least 8 characters')
      .openapi({ example: 'Secret@123' }),
  })
  .openapi('RegisterBody');

export const CreateUserBodySchema = z
  .object({
    name: z.string().min(1, 'name is required').openapi({ example: 'Jane Doe' }),
    email: z.string().email('A valid email is required').openapi({ example: 'jane@example.com' }),
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
    email: z.string().email('A valid email is required').optional().openapi({ example: 'new@example.com' }),
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

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type CreateUserInput = z.infer<typeof CreateUserBodySchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserBodySchema>;
export type LoginInput = z.infer<typeof LoginBodySchema>;
export type RegisterInput = z.infer<typeof RegisterBodySchema>;
