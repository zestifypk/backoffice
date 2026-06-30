const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { getEnv } = require('../config/env');
const logger = require('../config/logger');

async function upsertRole(name, description) {
  await pool.execute(
    `INSERT INTO roles (name, description)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description)`,
    [name, description]
  );

  const [rows] = await pool.execute('SELECT id FROM roles WHERE name = ? LIMIT 1', [name]);
  return rows[0].id;
}

async function upsertPermission(name, description) {
  await pool.execute(
    `INSERT INTO permissions (name, description)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description)`,
    [name, description]
  );

  const [rows] = await pool.execute('SELECT id FROM permissions WHERE name = ? LIMIT 1', [name]);
  return rows[0].id;
}

async function linkRolePermission(roleId, permissionId) {
  await pool.execute(
    `INSERT IGNORE INTO role_permissions (role_id, permission_id)
     VALUES (?, ?)`,
    [roleId, permissionId]
  );
}

async function upsertAdminUser() {
  const adminEmail = getEnv('ADMIN_SEED_EMAIL', 'admin@example.com');
  const adminName = getEnv('ADMIN_SEED_NAME', 'System Admin');
  const adminPassword = getEnv('ADMIN_SEED_PASSWORD', 'Admin@12345');
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await pool.execute(
    `INSERT INTO users (full_name, email, password_hash, status)
     VALUES (?, ?, ?, 'Active')
     ON DUPLICATE KEY UPDATE
       full_name = VALUES(full_name),
       password_hash = VALUES(password_hash),
       status = VALUES(status)`,
    [adminName, adminEmail, passwordHash]
  );

  const [rows] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);
  return rows[0].id;
}

async function main() {
  const adminRoleId = await upsertRole('admin', 'Administrator');
  const managerRoleId = await upsertRole('manager', 'Manager');
  const userRoleId = await upsertRole('user', 'Standard user');

  const permissions = [
    ['users:read', 'Read users'],
    ['users:create', 'Create users'],
    ['users:assign-role', 'Assign role to users'],
    ['roles:read', 'Read roles'],
    ['permissions:read', 'Read permissions'],
  ];

  const permissionIds = [];
  for (const [name, description] of permissions) {
    permissionIds.push(await upsertPermission(name, description));
  }

  for (const permissionId of permissionIds) {
    await linkRolePermission(adminRoleId, permissionId);
  }

  await linkRolePermission(managerRoleId, permissionIds[0]);
  await linkRolePermission(managerRoleId, permissionIds[3]);

  await linkRolePermission(userRoleId, permissionIds[0]);

  const adminUserId = await upsertAdminUser();
  await pool.execute(
    `INSERT IGNORE INTO user_roles (user_id, role_id)
     VALUES (?, ?)`,
    [adminUserId, adminRoleId]
  );

  logger.info('Seed completed. Default admin: admin@example.com / Admin@12345');
  await pool.end();
}

main().catch(async (error) => {
  logger.error({ err: error }, 'Seed failed');
  await pool.end();
  process.exit(1);
});
