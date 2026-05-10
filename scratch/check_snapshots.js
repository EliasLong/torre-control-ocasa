
import { query } from './src/lib/sql.js';

async function checkSnapshots() {
  try {
    const snapshots = await query('SELECT * FROM evento_kpi_snapshots ORDER BY date DESC');
    console.log(JSON.stringify(snapshots, null, 2));
  } catch (err) {
    console.error('Error querying snapshots:', err);
  }
}

checkSnapshots();
