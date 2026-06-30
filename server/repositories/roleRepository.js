const { pool } = require('../config/db');

async function listRoles() {
  const [rows] = await pool.execute(
    `SELECT id, name, description
     FROM roles
     ORDER BY id ASC`
  );
  return rows;
}

async function findRoleByName(name) {
  const [rows] = await pool.execute(
    `SELECT id, name, description
     FROM roles
     WHERE name = ?
     LIMIT 1`,
    [name]
  );
  return rows[0] || null;
}

async function findRolesByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.name, r.description
     FROM roles r
     INNER JOIN user_roles ur ON ur.role_id = r.id
     WHERE ur.user_id = ?
     ORDER BY r.id ASC`,
    [userId]
  );
  return rows;
}

async function assignRole(userId, roleId) {
  await pool.execute(
    `INSERT IGNORE INTO user_roles (user_id, role_id)
     VALUES (?, ?)`,
    [userId, roleId]
  );
}

module.exports = {
  listRoles,
  findRoleByName,
  findRolesByUserId,
  assignRole,
};
