/**
 * Google Apps Script — Pegar en Extensions > Apps Script del Google Sheet
 *
 * Este script crea los tabs necesarios con headers y datos mock iniciales.
 * Ejecutar la función: setupAllSheets()
 */

// ============================================================
// COPIAR TODO DESDE ACÁ EN Google Apps Script del Sheet
// ============================================================

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  createOperacionalSheet(ss);
  createFinancieroSheet(ss);
  createTarifasSheet(ss);
  createCostosSheet(ss);
  createObjetivosSheet(ss);
  createMermaSheet(ss);
  createTorreControlSheet(ss);

  SpreadsheetApp.getUi().alert('¡Todas las hojas fueron creadas exitosamente!');
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    sheet.clear();
  }
  return sheet;
}

function createOperacionalSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'operacional');
  const headers = ['fecha', 'picking', 'pallets_in', 'pallets_out_b2c', 'pallets_out_b2b', 'contenedores'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  // Mock data — March 2026
  const data = [];
  for (let d = 1; d <= 30; d++) {
    const fecha = '2026-03-' + String(d).padStart(2, '0');
    const picking = 1200 + Math.floor(Math.random() * 600);
    const pallets_in = 180 + Math.floor(Math.random() * 100);
    const pallets_out_b2c = 120 + Math.floor(Math.random() * 80);
    const pallets_out_b2b = 60 + Math.floor(Math.random() * 60);
    const contenedores = 3 + Math.floor(Math.random() * 5);
    data.push([fecha, picking, pallets_in, pallets_out_b2c, pallets_out_b2b, contenedores]);
  }
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}

function createFinancieroSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'financiero');
  const headers = ['fecha', 'facturacion', 'costos_fijos', 'costos_variables', 'resultado', 'margen'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const data = [];
  const costosFijos = 830000000; // $830M fijos mensuales
  for (let d = 1; d <= 30; d++) {
    const fecha = '2026-03-' + String(d).padStart(2, '0');
    const factDiaria = 25000000 + Math.floor(Math.random() * 15000000);
    const costosVar = 10000000 + Math.floor(Math.random() * 5000000);
    const resultado = factDiaria - (costosFijos / 30) - costosVar;
    const margen = Math.round((resultado / factDiaria) * 10000) / 100;
    data.push([fecha, factDiaria, Math.round(costosFijos / 30), costosVar, Math.round(resultado), margen]);
  }
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}

function createTarifasSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'tarifas');
  const headers = ['servicio', 'tarifa', 'vigencia_desde', 'vigencia_hasta'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const data = [
    ['Picking', 3869, '2026-01-01', ''],
    ['Pallet IN', 3869, '2026-01-01', ''],
    ['Pallet OUT', 3500, '2026-01-01', ''],
    ['Contenedor', 227617, '2026-01-01', ''],
    ['Guarda (mensual)', 730000000, '2026-01-01', ''],
    ['Apertura de Planta (por sábado)', 5179370, '2026-01-01', ''],
  ];
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}

function createCostosSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'costos');
  const headers = ['concepto', 'tipo', 'monto', 'vigencia_desde', 'vigencia_hasta'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const data = [
    ['Nómina fija', 'fijo', 130000000, '2026-01-01', ''],
    ['Costo fijo planta', 'fijo', 700000000, '2026-01-01', ''],
    ['Jornal', 'variable', 723000, '2026-01-01', ''],
  ];
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}

function createObjetivosSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'objetivos');
  const headers = ['mes', 'contenedores', 'pallets_in', 'picking', 'pallets_out'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const data = [
    ['2026-01', 140, 6500, 41000, 8500],
    ['2026-02', 130, 6000, 38000, 7800],
    ['2026-03', 150, 6800, 43530, 8944],
    ['2026-04', 145, 6600, 42000, 8700],
    ['2026-05', 155, 7000, 45000, 9200],
    ['2026-06', 140, 6400, 40000, 8400],
    ['2026-07', 135, 6200, 39000, 8100],
    ['2026-08', 145, 6700, 42500, 8800],
    ['2026-09', 150, 6900, 44000, 9000],
    ['2026-10', 160, 7200, 46000, 9500],
    ['2026-11', 155, 7000, 45000, 9200],
    ['2026-12', 130, 6000, 38000, 7800],
  ];
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}

function createMermaSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'merma');
  const headers = ['fecha', 'sku', 'descripcion', 'cantidad', 'motivo', 'valor'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  const motivos = ['Daño en transporte', 'Vencimiento', 'Rotura en almacén', 'Error de picking', 'Defecto de fábrica'];
  const skus = ['SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005', 'SKU-010', 'SKU-015', 'SKU-020'];
  const data = [];
  for (let d = 1; d <= 30; d++) {
    const items = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < items; i++) {
      const fecha = '2026-03-' + String(d).padStart(2, '0');
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const cant = 1 + Math.floor(Math.random() * 5);
      const motivo = motivos[Math.floor(Math.random() * motivos.length)];
      const valor = cant * (5000 + Math.floor(Math.random() * 20000));
      data.push([fecha, sku, 'Electrodoméstico ' + sku.split('-')[1], cant, motivo, valor]);
    }
  }
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}

function createTorreControlSheet(ss) {
  const sheet = getOrCreateSheet(ss, 'torre_control');
  const headers = [
    'fecha', 'contenedores_recibidos', 'contenedores_pendientes', 'pallets_in',
    'posiciones_ocupadas', 'posiciones_totales',
    'pallets_out_b2c', 'pallets_out_b2b', 'picking_completado', 'picking_pendiente',
    'jornales_presentes', 'jornales_totales', 'picking_por_jornal', 'pallets_out_por_jornal'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');

  // Last 7 days of data
  const data = [];
  for (let d = 12; d <= 18; d++) {
    const fecha = '2026-03-' + String(d).padStart(2, '0');
    const contRec = 4 + Math.floor(Math.random() * 4);
    const contPend = Math.floor(Math.random() * 3);
    const pallIn = 200 + Math.floor(Math.random() * 80);
    const posOcup = 12000 + Math.floor(Math.random() * 1000);
    const posTot = 15000;
    const pallB2C = 150 + Math.floor(Math.random() * 60);
    const pallB2B = 70 + Math.floor(Math.random() * 50);
    const pickComp = 1200 + Math.floor(Math.random() * 300);
    const pickPend = 200 + Math.floor(Math.random() * 150);
    const jornPres = 55 + Math.floor(Math.random() * 10);
    const jornTot = 65;
    const pickJorn = Math.round((pickComp / jornPres) * 10) / 10;
    const pallJorn = Math.round(((pallB2C + pallB2B) / jornPres) * 10) / 10;
    data.push([fecha, contRec, contPend, pallIn, posOcup, posTot, pallB2C, pallB2B, pickComp, pickPend, jornPres, jornTot, pickJorn, pallJorn]);
  }
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  sheet.autoResizeColumns(1, headers.length);
}
