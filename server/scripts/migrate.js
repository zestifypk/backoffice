const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../config/db');
const logger = require('../config/logger');

async function ensureMigrationTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationNames() {
  const [rows] = await pool.execute('SELECT name FROM schema_migrations');
  return new Set(rows.map((row) => row.name));
}

async function runMigrationFile(fileName) {
  const migrationPath = path.join(__dirname, '../migrations/sql', fileName);
  const sql = await fs.readFile(migrationPath, 'utf8');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(sql);
    await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [fileName]);
    await connection.commit();
    logger.info({ migration: fileName }, 'Migration applied');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function main() {
  await ensureMigrationTable();
  const applied = await getAppliedMigrationNames();

  const migrationDir = path.join(__dirname, '../migrations/sql');
  const files = (await fs.readdir(migrationDir))
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (applied.has(file)) {
      logger.info({ migration: file }, 'Skipping already applied migration');
      continue;
    }
    await runMigrationFile(file);
  }

  logger.info('Migrations completed successfully');
  await pool.end();
}

main().catch(async (error) => {
  logger.error({ err: error }, 'Migration failed');
  await pool.end();
  process.exit(1);
});
