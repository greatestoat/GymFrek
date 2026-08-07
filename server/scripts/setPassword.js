require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

async function main() {
  const password = 'Rahul@123456';
  const hashes = [
    'rahulnanda9899@gmail.com',
    'rahul@gymfrek.com',
    'rahul@frek.com',
    'sunny@gmail.com',
    'vijayalasxmipadam@gmail.com',
    'jhondoe12@gmail.com',
  ];
  const hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `UPDATE users SET password_hash = $1, is_active = TRUE WHERE email = ANY($2::text[]) RETURNING id, email`,
    [hash, hashes]
  );
  console.log(JSON.stringify(result.rows, null, 2));
  await pool.end();
}

main().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
