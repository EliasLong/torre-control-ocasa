
const { getMovimientosPorFechas } = require('./src/services/indicadores.service');

async function analyze() {
  const EVENT_DAYS_YYYY_MM_DD = [
    '2026-05-11', '2026-05-12', '2026-05-13', '2026-05-14',
    '2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18'
  ];
  
  try {
    const movimientos = await getMovimientosPorFechas(EVENT_DAYS_YYYY_MM_DD);
    const pickings = movimientos.filter(m => m.tipoTransaccion.toLowerCase() === 'sales order pick');
    
    const subtransfers = {};
    const clientes = {};
    const lpnPrefixes = {};

    pickings.forEach(m => {
      subtransfers[m.subTransferencia] = (subtransfers[m.subTransferencia] || 0) + Math.abs(m.cantidad);
      clientes[m.cliente] = (clientes[m.cliente] || 0) + Math.abs(m.cantidad);
      const prefix = m.lpnTransferido.substring(0, 3);
      lpnPrefixes[prefix] = (lpnPrefixes[prefix] || 0) + Math.abs(m.cantidad);
    });

    console.log('Sub-transfers for Sales Order Pick:');
    console.log(JSON.stringify(subtransfers, null, 2));
    
    console.log('\nClientes for Sales Order Pick:');
    console.log(JSON.stringify(clientes, null, 2));

    console.log('\nLPN Prefixes for Sales Order Pick:');
    console.log(JSON.stringify(lpnPrefixes, null, 2));

  } catch (e) {
    console.error(e);
  }
}

analyze();
