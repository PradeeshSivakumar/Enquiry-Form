const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('MySQL connection error:', err);
  });
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully.');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('Query Result:', rows[0].result);
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

module.exports = {
  pool,
  testConnection
};
