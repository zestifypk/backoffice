import { pool } from '@/lib/db';
import type { User } from '@/types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface UserRow extends RowDataPacket {
  id: number;
  full_name: string;
  email: string;
  password_hash: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  deleted_at: string | null;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    status: row.status,
    joined: row.created_at,
    deletedAt: row.deleted_at ?? null,
  };
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, full_name, email, password_hash, status, created_at, deleted_at
     FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id: number): Promise<User | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, full_name, email, status, created_at, deleted_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listAll(includeDeleted = false): Promise<User[]> {
  const sql = includeDeleted
    ? `SELECT id, full_name, email, status, created_at, deleted_at FROM users ORDER BY id DESC`
    : `SELECT id, full_name, email, status, created_at, deleted_at FROM users WHERE deleted_at IS NULL ORDER BY id DESC`;

  const [rows] = await pool.execute<UserRow[]>(sql);
  return rows.map(mapUser);
}

export async function createUser({
  name,
  email,
  passwordHash,
  status = 'Active',
}: {
  name: string;
  email: string;
  passwordHash: string;
  status?: 'Active' | 'Inactive';
}): Promise<User> {
  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, status]
  );
  const user = await findById(result.insertId);
  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function updateUser(
  id: number,
  data: { name?: string; email?: string; status?: 'Active' | 'Inactive' }
): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push('full_name = ?');
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }

  if (fields.length === 0) return findById(id);

  values.push(id);
  await pool.execute<ResultSetHeader>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
    values as string[]
  );
  return findById(id);
}

export async function softDeleteUser(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
}

export async function hardDeleteUser(id: number): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `DELETE FROM users WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

export async function findPasswordHashById(id: number): Promise<string | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return rows[0]?.password_hash ?? null;
}

export async function updatePasswordHash(id: number, passwordHash: string): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    `UPDATE users SET password_hash = ? WHERE id = ? AND deleted_at IS NULL`,
    [passwordHash, id]
  );
  return result.affectedRows > 0;
}
