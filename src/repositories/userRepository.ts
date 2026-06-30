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
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    status: row.status,
    joined: row.created_at,
  };
}

export async function findByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, full_name, email, password_hash, status, created_at
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id: number): Promise<User | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, full_name, email, status, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function listAll(): Promise<User[]> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, full_name, email, status, created_at
     FROM users ORDER BY id DESC`
  );
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
