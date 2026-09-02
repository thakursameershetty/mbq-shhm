require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetData() {
  try {
    console.log('Connecting to database...');

    await pool.query('BEGIN');

    // Clear all users and reset the auto-incrementing ID counter back to 1
    // (CASCADE also clears dependent rows in chat_sessions/chat_usage via their FK)
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    console.log('✅ Users table wiped clean and IDs reset.');

    await pool.query('COMMIT');
    console.log('🎉 Database reset complete! Ready for fresh testing.');

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetData();
