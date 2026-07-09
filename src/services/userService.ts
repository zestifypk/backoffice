import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import * as userRepository from '@/repositories/userRepository';
import * as roleRepository from '@/repositories/roleRepository';
import * as permissionRepository from '@/repositories/permissionRepository';
import type { User } from '@/types';
import type { CreateUserInput, UpdateUserInput, AssignRolesInput, AssignPermissionsInput } from '@/lib/schemas';

const log = logger.child({ module: 'userService' });

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

async function attachRelations(user: User): Promise<User> {
  const [roles, permissions, directPermissions] = await Promise.all([
    roleRepository.findRolesByUserId(user.id),
    permissionRepository.findPermissionsByUserId(user.id),
    permissionRepository.findDirectPermissionsByUserId(user.id),
  ]);
  return {
    ...user,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
    directPermissions: directPermissions.map((p) => p.name),
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

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  log.info({ userId }, 'Changing password');

  const hash = await userRepository.findPasswordHashById(userId);
  if (!hash) throw makeError('User not found', 404);

  const matches = await bcrypt.compare(currentPassword, hash);
  if (!matches) throw makeError('Current password is incorrect', 400);

  const newHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePasswordHash(userId, newHash);
  log.info({ userId }, 'Password changed');
}

export async function resetPassword(userId: number, newPassword: string): Promise<void> {
  log.info({ userId }, 'Resetting password');

  const user = await userRepository.findById(userId);
  if (!user) throw makeError('User not found', 404);

  const newHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePasswordHash(userId, newHash);
  log.info({ userId }, 'Password reset by admin');
}

export async function assignRolesToUser(userId: number, data: AssignRolesInput): Promise<User> {
  log.info({ userId, roles: data.roles }, 'Assigning roles to user');

  const user = await userRepository.findById(userId);
  if (!user) throw makeError('User not found', 404);
  if (user.deletedAt) throw makeError('Cannot assign roles to a deleted user', 410);

  if (data.roles.length > 0) {
    const roles = await roleRepository.findRolesByNames(data.roles);
    const missing = data.roles.filter((n) => !roles.find((r) => r.name === n));
    if (missing.length > 0) throw makeError(`Unknown roles: ${missing.join(', ')}`, 400);
    await roleRepository.setRolesForUser(userId, roles.map((r) => r.id));
  } else {
    await roleRepository.setRolesForUser(userId, []);
  }

  log.info({ userId }, 'Roles assigned');
  return attachRelations(user);
}

export async function assignPermissionsToUser(userId: number, data: AssignPermissionsInput): Promise<User> {
  log.info({ userId, permissions: data.permissions }, 'Assigning direct permissions to user');

  const user = await userRepository.findById(userId);
  if (!user) throw makeError('User not found', 404);
  if (user.deletedAt) throw makeError('Cannot assign permissions to a deleted user', 410);

  if (data.permissions.length > 0) {
    const perms = await permissionRepository.findPermissionsByNames(data.permissions);
    const missing = data.permissions.filter((n) => !perms.find((p) => p.name === n));
    if (missing.length > 0) throw makeError(`Unknown permissions: ${missing.join(', ')}`, 400);
    await permissionRepository.setDirectPermissionsForUser(userId, perms.map((p) => p.id));
  } else {
    await permissionRepository.setDirectPermissionsForUser(userId, []);
  }

  log.info({ userId }, 'Direct permissions assigned');
  return attachRelations(user);
}
