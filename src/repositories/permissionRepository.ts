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

export async function findPermissionsByUserId(userId: number): Promise<Permission[]> {
  const [rows] = await pool.execute<PermissionRow[]>(
    `SELECT DISTINCT p.id, p.name, p.description
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     INNER JOIN user_roles ur ON ur.role_id = rp.role_id
     WHERE ur.user_id = ?
     ORDER BY p.id ASC`,
    [userId]
  );
  return rows;
}
