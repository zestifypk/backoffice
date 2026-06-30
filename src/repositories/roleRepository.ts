import { pool } from '@/lib/db';
import type { Role } from '@/types';
import type { RowDataPacket } from 'mysql2';

interface RoleRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
}

export async function listRoles(): Promise<Role[]> {
  const [rows] = await pool.execute<RoleRow[]>(
    `SELECT id, name, description FROM roles ORDER BY id ASC`
  );
  return rows;
}

export async function findRoleByName(name: string): Promise<Role | null> {
  const [rows] = await pool.execute<RoleRow[]>(
    `SELECT id, name, description FROM roles WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows[0] ?? null;
}

export async function findRolesByUserId(userId: number): Promise<Role[]> {
  const [rows] = await pool.execute<RoleRow[]>(
    `SELECT r.id, r.name, r.description
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?
     ORDER BY r.id ASC`,
    [userId]
  );
  return rows;
}

export async function assignRole(userId: number, roleId: number): Promise<void> {
  await pool.execute(
    `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
    [userId, roleId]
  );
}
