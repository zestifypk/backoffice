const mysql = require('mysql2/promise');
const { loadEnv, getEnv } = require('./env');
const logger = require('./logger');

loadEnv();

const pool = mysql.createPool({
  host: getEnv('DB_HOST', '127.0.0.1'),
  port: Number(getEnv('DB_PORT', '3306')),
  user: getEnv('DB_USER', 'root'),
  password: getEnv('DB_PASSWORD', ''),
  database: getEnv('DB_NAME', 'backoffice'),
  waitForConnections: true,
  connectionLimit: Number(getEnv('DB_POOL_MAX', getEnv('DB_POOL_SIZE', '10'))),
  queueLimit: 0,
});

async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    logger.info('MySQL connection established');
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
};
