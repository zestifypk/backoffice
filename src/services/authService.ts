import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import * as userRepository from '@/repositories/userRepository';
import * as roleRepository from '@/repositories/roleRepository';
import * as permissionRepository from '@/repositories/permissionRepository';
import type { User, JwtPayload } from '@/types';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function register(data: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw makeError('Email already exists', 409);

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await userRepository.createUser({
    name: data.name,
    email: data.email,
    passwordHash,
  });

  const userRole = await roleRepository.findRoleByName('user');
  if (userRole) await roleRepository.assignRole(user.id, userRole.id);

  return user;
}

export async function login(data: { email: string; password: string }) {
  const userRow = await userRepository.findByEmail(data.email);
  if (!userRow) throw makeError('Invalid credentials', 401);

  const valid = await bcrypt.compare(data.password, userRow.password_hash);
  if (!valid) throw makeError('Invalid credentials', 401);

  const roles = await roleRepository.findRolesByUserId(userRow.id);
  const permissions = await permissionRepository.findPermissionsByUserId(userRow.id);

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: userRow.id,
    email: userRow.email,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
  };

  const token = await signToken(payload);

  return {
    token,
    user: {
      id: userRow.id,
      name: userRow.full_name,
      email: userRow.email,
      status: userRow.status,
      roles: payload.roles,
      permissions: payload.permissions,
    },
  };
}

export async function getCurrentUser(userId: number) {
  const user = await userRepository.findById(userId);
  if (!user) throw makeError('User not found', 404);

  const roles = await roleRepository.findRolesByUserId(userId);
  const permissions = await permissionRepository.findPermissionsByUserId(userId);

  return {
    ...user,
    roles: roles.map((r) => r.name),
    permissions: permissions.map((p) => p.name),
  };
}
