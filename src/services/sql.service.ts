import { sheetsService } from '@/services/sheets.service';
import { operationalService } from '@/services/operational.service';

// Legacy service — now delegates to Google Sheets via sheetsService
// Chesterton's Fence: some components may still reference sqlService
export const sqlService = {
  getOperacionalData: async () => {
    const desde = new Date('2026-03-01');
    const hasta = new Date('2026-03-30');
    return operationalService.getOperaciones(desde, hasta);
  },
  getMermaData: async () => sheetsService.getMermaData(),
  getAbcXyzData: async () => {
    // ABC-XYZ still uses local mock for now (requires more complex data)
    const { abcxyzMock } = await import('@/lib/mock/abcxyz.mock');
    return abcxyzMock;
  },
  getPalletsOut: operationalService.getPalletsOut,
  getOperaciones: operationalService.getOperaciones,
};
