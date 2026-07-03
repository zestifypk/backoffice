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

export async function findRolesByNames(names: string[]): Promise<Role[]> {
  if (names.length === 0) return [];
  const placeholders = names.map(() => '?').join(', ');
  const [rows] = await pool.execute<RoleRow[]>(
    `SELECT id, name, description FROM roles WHERE name IN (${placeholders})`,
    names
  );
  return rows;
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

/**
 * Replaces all role assignments for a user in a single transaction.
 * Pass an empty array to strip all roles.
 */
export async function setRolesForUser(userId: number, roleIds: number[]): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);
    if (roleIds.length > 0) {
      const placeholders = roleIds.map(() => '(?, ?)').join(', ');
      const values = roleIds.flatMap((rid) => [userId, rid]);
      await conn.execute(
        `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES ${placeholders}`,
        values
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
