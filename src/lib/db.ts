import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? '3306'),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'backoffice',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_MAX ?? '10'),
    queueLimit: 0,
  });
}

// Singleton pool — prevents multiple connections during Next.js hot reload in dev
export const pool: mysql.Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (globalThis._mysqlPool ??= createPool());
