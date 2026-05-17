const mysql = require('mysql2/promise');

let pool;

async function connectDB() {
  pool = mysql.createPool({
    host    : process.env.DB_HOST     || 'localhost',
    port    : process.env.DB_PORT     || 3306,
    user    : process.env.DB_USER     || 'shopuser',
    password: process.env.DB_PASSWORD || 'shoppass',
    database: process.env.DB_NAME     || 'shopdb',
    waitForConnections: true,
    connectionLimit   : 10,
    queueLimit        : 0,
  });

  // verify connection on startup
  try {
    const conn = await pool.getConnection();
    console.log('[db] Connected to MySQL');
    conn.release();
  } catch (err) {
    console.error('[db] MySQL connection failed:', err.message);
    process.exit(1);   // hard fail — app is useless without DB
  }
}

function getPool() {
  if (!pool) throw new Error('DB not initialised. Call connectDB() first.');
  return pool;
}

module.exports = { connectDB, getPool };
