const { pool } = require('../config/db');

async function listPermissions() {
  const [rows] = await pool.execute(
    `SELECT id, name, description
     FROM permissions
     ORDER BY id ASC`
  );
  return rows;
}

async function findPermissionsByUserId(userId) {
  const [rows] = await pool.execute(
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

module.exports = {
  listPermissions,
  findPermissionsByUserId,
};
