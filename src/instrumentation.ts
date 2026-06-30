import { readdir, readFile } from 'fs/promises';
import path from 'path';

export async function register() {
  // Only runs on the Node.js runtime (not Edge), once on server startup
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    const { pool } = await import('@/lib/db');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [rows] = await pool.execute<import('mysql2').RowDataPacket[]>(
      'SELECT name FROM schema_migrations'
    );
    const applied = new Set(rows.map((r) => r.name as string));

    const migrationsDir = path.join(process.cwd(), 'migrations', 'sql');
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(sql);
        await connection.execute('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
        await connection.commit();
        console.log(`[migrate] applied: ${file}`);
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    }
  } catch (err) {
    console.error('[migrate] failed:', err);
    // Don't crash the server — log and continue
  }
}
