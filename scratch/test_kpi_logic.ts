import { query } from '@/lib/sql';
import { getEventoData } from '@/app/api/evento/kpis/route';

async function testLogic() {
  try {
    const data = await getEventoData();
    console.log('Available Days:', data.availableDays);
    console.log('Data for 11/05:', data.byDay['11/05']);
    console.log('Data for 12/05:', data.byDay['12/05']);
    console.log('Data for 13/05:', data.byDay['13/05']);
  } catch (e) {
    console.error(e);
  }
}

testLogic();
