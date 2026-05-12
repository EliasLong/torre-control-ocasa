
import { query } from './src/lib/sql';

async function checkSnapshots() {
  try {
    const snapshots = await query(`
      SELECT * FROM evento_kpi_snapshots 
      WHERE date = '2026-05-11'
    `);
    console.log('Snapshots for 2026-05-11:', JSON.stringify(snapshots, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSnapshots();
