import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  const base: mysql.PoolOptions = {
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'backoffice',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_MAX ?? '10'),
    queueLimit: 0,
  };

  // On Hostinger (and most shared hosting), MySQL only allows socket connections.
  // Set DB_SOCKET to the socket path to bypass TCP auth restrictions.
  if (process.env.DB_SOCKET) {
    return mysql.createPool({ ...base, socketPath: process.env.DB_SOCKET });
  }

  return mysql.createPool({
    ...base,
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? '3306'),
  });
}

// Singleton pool — prevents multiple connections during Next.js hot reload in dev
export const pool: mysql.Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (globalThis._mysqlPool ??= createPool());
