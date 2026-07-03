import dotenv from 'dotenv';
import { existsSync } from 'fs';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import pino from 'pino';

if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
dotenv.config();

const logger = pino({ level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } });

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'backoffice',
});

async function upsertRole(name: string, description: string): Promise<number> {
  await pool.execute(
    `INSERT INTO roles (name, description) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description)`,
    [name, description]
  );
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM roles WHERE name = ? LIMIT 1',
    [name]
  );
  return rows[0].id as number;
}

async function upsertPermission(name: string, description: string): Promise<number> {
  await pool.execute(
    `INSERT INTO permissions (name, description) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description)`,
    [name, description]
  );
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM permissions WHERE name = ? LIMIT 1',
    [name]
  );
  return rows[0].id as number;
}

async function linkRolePermission(roleId: number, permissionId: number) {
  await pool.execute(
    'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
    [roleId, permissionId]
  );
}

async function upsertAdminUser(): Promise<number> {
  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@example.com';
  const name = process.env.ADMIN_SEED_NAME ?? 'System Admin';
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'Admin@12345';
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.execute(
    `INSERT INTO users (full_name, email, password_hash, status) VALUES (?, ?, ?, 'Active')
     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash)`,
    [name, email, passwordHash]
  );

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0].id as number;
}

async function main() {
  const adminRoleId   = await upsertRole('admin',   'Administrator');
  const managerRoleId = await upsertRole('manager', 'Manager');
  const userRoleId    = await upsertRole('user',    'Standard user');

  const permDefs: [string, string][] = [
    ['users:read',           'Read users'],
    ['users:create',         'Create users'],
    ['users:assign-role',    'Assign role to users'],
    ['users:reset-password', 'Allow resetting any user password'],
    ['roles:read',           'Read roles'],
    ['permissions:read',     'Read permissions'],
  ];

  const permIds = await Promise.all(permDefs.map(([n, d]) => upsertPermission(n, d)));

  // Admin gets all permissions
  for (const id of permIds) await linkRolePermission(adminRoleId, id);

  // Manager: users:read, roles:read
  await linkRolePermission(managerRoleId, permIds[0]);
  await linkRolePermission(managerRoleId, permIds[3]);

  // User: users:read
  await linkRolePermission(userRoleId, permIds[0]);

  const adminUserId = await upsertAdminUser();
  await pool.execute(
    'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [adminUserId, adminRoleId]
  );

  logger.info(
    `Seed complete. Admin: ${process.env.ADMIN_SEED_EMAIL ?? 'admin@example.com'} / ${process.env.ADMIN_SEED_PASSWORD ?? 'Admin@12345'}`
  );
  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, 'Seed failed');
  await pool.end();
  process.exit(1);
});
