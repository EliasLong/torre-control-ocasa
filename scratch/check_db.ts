import { query } from './src/lib/sql.ts';

async function checkResults() {
  try {
    const rows = await query('SELECT * FROM evento_resultados_finales ORDER BY date ASC');
    console.log('--- evento_resultados_finales ---');
    console.table(rows);
    
    const snapshots = await query("SELECT date, bultos_b2c, bultos_b2b FROM evento_kpi_snapshots WHERE date >= '2026-05-11' ORDER BY date ASC");
    console.log('--- evento_kpi_snapshots ---');
    console.table(snapshots);
  } catch (e) {
    console.error(e);
  }
}

checkResults();
