const fs = require('fs');

const MONTHS = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
};

function parseIngresadosDate(raw) {
  if (!raw || raw.trim() === '') return null;
  const parts = raw.trim().split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toUpperCase();
    const month = parseInt(MONTHS[monthStr] || '1', 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

try {
  console.log(parseIngresadosDate("30-APR-26"));
  console.log(parseIngresadosDate("invalid"));
} catch (e) {
  console.error(e);
}
