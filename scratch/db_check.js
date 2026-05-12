
const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.yumredpotusegemxudft:TorreControl2026!@aws-1-sa-east-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSnapshots() {
  try {
    const res = await pool.query("SELECT * FROM evento_kpi_snapshots WHERE date = '2026-05-11'");
    console.log('Snapshots for 2026-05-11:');
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSnapshots();
