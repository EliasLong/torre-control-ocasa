const fs = require('fs');
const https = require('https');

const SPREADSHEET_B2C = '12THXnAPh19StLyMc-wOp_iqz9cvD__ktVxwuKNcoTMM';
const SPREADSHEET_B2B = '1qSptp0U_8fuo_bAcsQtsLl5ROVzCN44kZHKuEHC24vI';

const SHEETS = {
  PL2_B2C: { id: SPREADSHEET_B2C, gid: '0', type: 'B2C' },
  PL3_B2C: { id: SPREADSHEET_B2C, gid: '2008554442', type: 'B2C' },
  PL2_B2B: { id: SPREADSHEET_B2B, gid: '1832488493', type: 'B2B' },
  PL3_B2B: { id: SPREADSHEET_B2B, gid: '2114457503', type: 'B2B' },
};

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

function parseSheetDate(raw) {
  if (!raw || raw.trim() === '') return null;
  const s = raw.replace(/[^\d/]/g, '');
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}`;
  }
  return null;
}

async function fetchCsv(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        return fetchCsv(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function test() {
  let despachados27 = 0;
  let lines = [];
  
  for (const key of Object.keys(SHEETS)) {
    const sheet = SHEETS[key];
    const text = await fetchCsv(csvUrl(sheet.id, sheet.gid));
    const rows = parseCsv(text);
    
    let sheetTotal = 0;
    
    for (const cols of rows) {
      if (cols.length < 5) continue;
      const rawDate = cols[0];
      if (!rawDate) continue;
      const dateKey = parseSheetDate(rawDate);
      
      if (dateKey === '27/04') {
        const isDispatched = cols.some(c => c.toLowerCase().includes('liberado'));
        if (isDispatched) {
          let bultos = 0;
          if (sheet.type === 'B2C') {
            bultos = (parseFloat(cols[4]) || 0) + (parseFloat(cols[7]) || 0);
          } else {
            bultos = parseFloat(cols[8]) || 0;
          }
          sheetTotal += bultos;
          lines.push(`[${key}] Row: ${cols.join(',').substring(0, 50)}... -> Bultos: ${bultos}`);
        }
      }
    }
    console.log(`${key} total for 27/04: ${sheetTotal}`);
    despachados27 += sheetTotal;
  }
  
  console.log(`\nGrand Total Despachados for 27/04: ${despachados27}`);
}

test();
