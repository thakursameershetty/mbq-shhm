require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS request_status VARCHAR(20) NOT NULL DEFAULT 'pending';`);
    console.log('Ensured request_status column exists.');

    // Every pre-existing registration predates the admin-approval gate and is
    // already somewhere in the pipeline — back-fill it to 'accepted' so it
    // doesn't vanish from the Volunteer page or flood the New Requests tab.
    const result = await pool.query(`UPDATE users SET request_status = 'accepted' WHERE request_status = 'pending';`);
    console.log(`Backfilled ${result.rowCount} existing user(s) to request_status = 'accepted'.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    pool.end();
  }
}
migrate();
