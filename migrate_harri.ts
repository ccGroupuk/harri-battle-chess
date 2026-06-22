import { pool } from './server/db.ts';

async function run() {
  try {
    await pool.query('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT \'\'');
    await pool.query('ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_name_unique UNIQUE(name)');
    console.log("DB migration completed");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
