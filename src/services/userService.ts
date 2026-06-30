import * as userRepository from '@/repositories/userRepository';
import * as roleRepository from '@/repositories/roleRepository';
import type { User } from '@/types';

function makeError(message: string, statusCode: number): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export async function listUsers(): Promise<User[]> {
  return userRepository.listAll();
}

export async function assignRole(data: { userId: number; roleName: string }) {
  const role = await roleRepository.findRoleByName(data.roleName);
  if (!role) throw makeError('Role not found', 404);

  await roleRepository.assignRole(data.userId, role.id);
  return { userId: data.userId, role: role.name };
}
