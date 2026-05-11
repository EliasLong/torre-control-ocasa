
const { getEventoData } = require('./src/app/api/evento/kpis/route');

async function test() {
  try {
    const data = await getEventoData();
    console.log('Volumen RetiMeli:', data.volumenRetiMeli);
    console.log('Volumen Andreani:', data.volumenAndreani);
    console.log('Volumen FlotaPropia:', data.volumenFlotaPropia);
    console.log('Volumen Otros:', data.volumenOtros);
    console.log('Available Days:', data.availableDays);
    console.log('First day KPIs:', data.byDay[data.availableDays[0]]);
  } catch (err) {
    console.error(err);
  }
}

test();
