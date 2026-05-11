require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT * FROM evento_kpi_snapshots ORDER BY date DESC LIMIT 5');
    console.log('Snapshots in DB:');
    for (const row of res.rows) {
      console.log(`Date: ${row.date}, Ingresados: ${row.ingresados}, Ingresados_Flota: ${row.ingresados_flota}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
