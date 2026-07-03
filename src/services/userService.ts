import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import * as userRepository from '@/repositories/userRepository';
import * as roleRepository from '@/repositories/roleRepository';
import * as permissionRepository from '@/repositories/permissionRepository';
import type { User } from '@/types';
import type { CreateUserInput, UpdateUserInput } from '@/lib/schemas';

const log = logger.child({ module: 'userService' });

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

async function attachRelations(user: User): Promise<User> {
  const [roles, permissions] = await Promise.all([
    roleRepository.findRolesByUserId(user.id),
    permissionRepository.findPermissionsByUserId(user.id),
  ]);
  return {
    ...user,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
  };
}

export async function listUsers(includeDeleted = false): Promise<User[]> {
  log.info({ includeDeleted }, 'Listing users');
  const users = await userRepository.listAll(includeDeleted);
  return Promise.all(users.map(attachRelations));
}

export async function getUserById(id: number): Promise<User> {
  log.info({ userId: id }, 'Fetching user by id');
  const user = await userRepository.findById(id);
  if (!user) throw makeError('User not found', 404);
  return attachRelations(user);
}

export async function createUser(data: CreateUserInput): Promise<User> {
  log.info({ email: data.email }, 'Creating user');

  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw makeError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await userRepository.createUser({
    name: data.name,
    email: data.email,
    passwordHash,
    status: data.status ?? 'Active',
  });

  // Assign roles
  if (data.roles && data.roles.length > 0) {
    const roles = await roleRepository.findRolesByNames(data.roles);
    const missing = data.roles.filter((n) => !roles.find((r) => r.name === n));
    if (missing.length > 0) throw makeError(`Unknown roles: ${missing.join(', ')}`, 400);
    await roleRepository.setRolesForUser(user.id, roles.map((r) => r.id));
  } else {
    // Default to 'user' role if no roles specified
    const userRole = await roleRepository.findRoleByName('user');
    if (userRole) await roleRepository.assignRole(user.id, userRole.id);
  }

  // Assign direct permissions
  if (data.permissions && data.permissions.length > 0) {
    const perms = await permissionRepository.findPermissionsByNames(data.permissions);
    const missing = data.permissions.filter((n) => !perms.find((p) => p.name === n));
    if (missing.length > 0) throw makeError(`Unknown permissions: ${missing.join(', ')}`, 400);
    await permissionRepository.setDirectPermissionsForUser(user.id, perms.map((p) => p.id));
  }

  log.info({ userId: user.id }, 'User created');
  return attachRelations(user);
}

export async function updateUser(id: number, data: UpdateUserInput): Promise<User> {
  log.info({ userId: id, fields: Object.keys(data) }, 'Updating user');

  const existing = await userRepository.findById(id);
  if (!existing) throw makeError('User not found', 404);
  if (existing.deletedAt) throw makeError('Cannot update a deleted user', 410);

  // Check email uniqueness if email is being changed
  if (data.email && data.email !== existing.email) {
    const taken = await userRepository.findByEmail(data.email);
    if (taken) throw makeError('Email already in use', 409);
  }

  const updated = await userRepository.updateUser(id, {
    name: data.name,
    email: data.email,
    status: data.status,
  });
  if (!updated) throw makeError('User not found', 404);

  // Replace roles if provided
  if (data.roles !== undefined) {
    if (data.roles.length > 0) {
      const roles = await roleRepository.findRolesByNames(data.roles);
      const missing = data.roles.filter((n) => !roles.find((r) => r.name === n));
      if (missing.length > 0) throw makeError(`Unknown roles: ${missing.join(', ')}`, 400);
      await roleRepository.setRolesForUser(id, roles.map((r) => r.id));
    } else {
      await roleRepository.setRolesForUser(id, []);
    }
  }

  // Replace direct permissions if provided
  if (data.permissions !== undefined) {
    if (data.permissions.length > 0) {
      const perms = await permissionRepository.findPermissionsByNames(data.permissions);
      const missing = data.permissions.filter((n) => !perms.find((p) => p.name === n));
      if (missing.length > 0) throw makeError(`Unknown permissions: ${missing.join(', ')}`, 400);
      await permissionRepository.setDirectPermissionsForUser(id, perms.map((p) => p.id));
    } else {
      await permissionRepository.setDirectPermissionsForUser(id, []);
    }
  }

  log.info({ userId: id }, 'User updated');
  return attachRelations(updated);
}

export async function softDeleteUser(id: number): Promise<void> {
  log.info({ userId: id }, 'Soft-deleting user');
  const deleted = await userRepository.softDeleteUser(id);
  if (!deleted) throw makeError('User not found or already deleted', 404);
  log.info({ userId: id }, 'User soft-deleted');
}

export async function hardDeleteUser(id: number): Promise<void> {
  log.info({ userId: id }, 'Hard-deleting user');
  const deleted = await userRepository.hardDeleteUser(id);
  if (!deleted) throw makeError('User not found', 404);
  log.info({ userId: id }, 'User hard-deleted');
}

/** @deprecated Use createUser or updateUser instead */
export async function assignRole(data: { userId: number; roleName: string }) {
  const role = await roleRepository.findRoleByName(data.roleName);
  if (!role) throw makeError('Role not found', 404);
  await roleRepository.assignRole(data.userId, role.id);
  return { userId: data.userId, role: role.name };
}
