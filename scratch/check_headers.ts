import { fetchSheetRows } from './src/lib/raw-sources';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    const ADMIN_SHEET = process.env.GOOGLE_SHEET_ID;
    console.log('Sheet ID:', ADMIN_SHEET);
    if (!ADMIN_SHEET) throw new Error('GOOGLE_SHEET_ID not set');
    const rows = await fetchSheetRows(ADMIN_SHEET, 'operaciones_sql');
    if (rows.length > 0) {
      console.log('Headers:', JSON.stringify(rows[0]));
      console.log('Row 1:', JSON.stringify(rows[1]));
    } else {
      console.log('No rows found');
    }
  } catch (e) {
    console.error(e);
  }
}

main();
