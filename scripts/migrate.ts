import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import pino from 'pino';

// Load env — .env.local first (local dev), then .env as fallback
if (existsSync('.env.local')) dotenv.config({ path: '.env.local' });
dotenv.config();

const logger = pino({ level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } });

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? '3306'),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'backoffice',
  multipleStatements: true,
});

async function ensureMigrationTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrationNames(): Promise<Set<string>> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name as string));
}

async function runMigrationFile(fileName: string) {
  const migrationPath = path.join(process.cwd(), 'migrations', 'sql', fileName);
  const sql = await readFile(migrationPath, 'utf8');

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

  const migrationDir = path.join(process.cwd(), 'migrations', 'sql');
  const files = (await readdir(migrationDir))
    .filter((f) => f.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (applied.has(file)) {
      logger.info({ migration: file }, 'Skipping already applied');
      continue;
    }
    await runMigrationFile(file);
  }

  logger.info('Migrations completed');
  await pool.end();
}

main().catch(async (err) => {
  logger.error({ err }, 'Migration failed');
  await pool.end();
  process.exit(1);
});
