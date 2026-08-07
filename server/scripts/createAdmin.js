/**
 * Creates (or promotes) a platform-admin account.
 *
 * There is no API endpoint for this on purpose - if creating an admin were
 * a public or even authenticated-user endpoint, any bug or leaked token
 * could hand out platform-wide access. Instead, run this from a trusted
 * machine with direct DB access whenever you need a new admin.
 *
 * Usage:
 *   node scripts/createAdmin.js --name="Jane Doe" --email=jane@gym_frek.com --password="a-strong-password"
 *
 * If the email already exists, this promotes that account to role='admin'
 * and (optionally) resets its password if --password is given.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');

const SALT_ROUNDS = 12;

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { name, email, password } = parseArgs();

  if (!email || (!password && true)) {
    // password is required only when creating a brand new account; checked below
  }
  if (!email) {
    console.error('Usage: node scripts/createAdmin.js --name="Jane Doe" --email=jane@example.com --password="..."');
    process.exit(1);
  }

  const existing = await pool.query('SELECT id, role FROM users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      await pool.query(
        `UPDATE users SET role = 'admin', password_hash = $1, is_active = TRUE WHERE id = $2`,
        [hash, userId]
      );
      console.log(`Promoted ${email} to admin and updated their password.`);
    } else {
      await pool.query(`UPDATE users SET role = 'admin', is_active = TRUE WHERE id = $1`, [userId]);
      console.log(`Promoted existing user ${email} to admin.`);
    }
  } else {
    if (!password || !name) {
      console.error('Creating a new admin requires --name and --password.');
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      [name, email, hash]
    );
    console.log(`Created new admin account for ${email}.`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
