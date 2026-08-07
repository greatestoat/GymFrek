require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');
const { pool } = require('./config/db');

const DEFAULT_PORT = Number(process.env.PORT || 5000);
const MAX_PORT_ATTEMPTS = 5;

async function ensurePlanSchemaCompatibility() {
  const migrationPath = path.join(__dirname, '..', 'db', '008_personal_training.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  try {
    await pool.query(migrationSql);
    console.log('Applied personal-training schema migration');
  } catch (err) {
    if (err.code === '42701' || err.message.includes('already exists') || err.message.includes('duplicate')) {
      console.warn('Personal-training schema migration already applied or skipped');
    } else {
      throw err;
    }
  }
}

async function start(port = DEFAULT_PORT, attempt = 1) {
  try {
    await pool.query('SELECT 1'); // fail fast if PostgreSQL isn't reachable
    await ensurePlanSchemaCompatibility();

    const server = app.listen(port, () => {
      console.log(`gym_frek API running on http://localhost:${port}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`);
        server.close(() => {
          start(nextPort, attempt + 1);
        });
      } else {
        console.error(`Failed to start server on port ${port}:`, err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  }
}

start();
