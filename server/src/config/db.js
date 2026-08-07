const { Pool } = require('pg');
require('dotenv').config();

// A single shared connection pool. Never build SQL strings by concatenation -
// every query in this project uses parameterized placeholders ($1, $2, ...)
// so user input can never be interpreted as SQL (prevents SQL injection).
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
