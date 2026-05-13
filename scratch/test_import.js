const SPREADSHEET_ID = '15T-YKuVXHs5XAX6hanAM3HlilEjbW4ODcwxmRTtHgFk';
const GID = '1670433793';

function csvUrl(spreadsheetId, gid) {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());
    return cols;
  });
}

async function testImport() {
  try {
    const url = csvUrl(SPREADSHEET_ID, GID);
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const text = await res.text();
    const rows = parseCsv(text);
    
    console.log(`Found ${rows.length} rows`);
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      console.log(`Row ${i}:`, cols);
    }
  } catch (e) {
    console.error(e);
  }
}

testImport();
