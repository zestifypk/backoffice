import { pool } from '@/lib/db';
import type { Permission } from '@/types';
import type { RowDataPacket } from 'mysql2';

interface PermissionRow extends RowDataPacket {
  id: number;
  name: string;
  description: string | null;
}

export async function listPermissions(): Promise<Permission[]> {
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT id, name, description FROM permissions ORDER BY id ASC`
  );
  return rows;
}

export async function findPermissionByName(name: string): Promise<Permission | null> {
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT id, name, description FROM permissions WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows[0] ?? null;
}

export async function findPermissionsByNames(names: string[]): Promise<Permission[]> {
  if (names.length === 0) return [];
  const placeholders = names.map(() => '?').join(', ');
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT id, name, description FROM permissions WHERE name IN (${placeholders})`,
    names
  );
  return rows;
}

/**
 * Returns all permissions for a user — from role assignments AND direct grants.
 * Used when building JWT payloads and the /me endpoint.
 */
export async function findPermissionsByUserId(userId: number): Promise<Permission[]> {
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT DISTINCT p.id, p.name, p.description
     FROM permissions p
     WHERE EXISTS (
       SELECT 1
       FROM role_permissions rp
       INNER JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE rp.permission_id = p.id AND ur.user_id = ?
     )
     OR EXISTS (
       SELECT 1
       FROM user_permissions up
       WHERE up.permission_id = p.id AND up.user_id = ?
     )
     ORDER BY p.id ASC`,
    [userId, userId]
  );
  return rows;
}

/** Returns only the permissions assigned directly to the user (not via roles). */
export async function findDirectPermissionsByUserId(userId: number): Promise<Permission[]> {
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT p.id, p.name, p.description
     FROM permissions p
     INNER JOIN user_permissions up ON up.permission_id = p.id
     WHERE up.user_id = ?
     ORDER BY p.id ASC`,
    [userId]
  );
  return rows;
}

/**
 * Replaces all direct permission assignments for a user in a single transaction.
 * Pass an empty array to revoke all direct permissions.
 */
export async function setDirectPermissionsForUser(
  userId: number,
  permissionIds: number[]
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM user_permissions WHERE user_id = ?`, [userId]);
    if (permissionIds.length > 0) {
      const placeholders = permissionIds.map(() => '(?, ?)').join(', ');
      const values = permissionIds.flatMap((pid) => [userId, pid]);
      await conn.execute(
        `INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES ${placeholders}`,
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
