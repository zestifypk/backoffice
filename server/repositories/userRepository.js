const { pool } = require('../config/db');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    status: row.status,
    joined: row.created_at,
  };
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, password_hash, status, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, status, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return mapUser(rows[0]);
}

async function listAll() {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, status, created_at
     FROM users
     ORDER BY id DESC`
  );
  return rows.map(mapUser);
}

async function createUser({ name, email, passwordHash, status = 'Active' }) {
  const [result] = await pool.execute(
    `INSERT INTO users (full_name, email, password_hash, status)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, status]
  );
  return findById(result.insertId);
}

module.exports = {
  findByEmail,
  findById,
  listAll,
  createUser,
};
