import { NextRequest, NextResponse } from 'next/server';
import { getPalletsOutFromSheets, getOperacionesFromSql, getJornalesFromSheet } from '@/lib/raw-sources';
import type { PalletOut, OperacionDiaria, PersonalDiario } from '@/types';

/**
 * Sync endpoint — reads from raw sources and returns aggregated data.
 * Can be called manually or via Vercel Cron Job (daily at 02:00 UTC).
 *
 * GET /api/sync          → returns aggregated data as JSON
 * GET /api/sync?write=1  → (future) also writes to intermediate Google Sheet
 */

export async function GET(request: NextRequest) {
  try {
    const [palletsOut, operaciones, jornales] = await Promise.all([
      getPalletsOutFromSheets(),
      getOperacionesFromSql(),
      getJornalesFromSheet(),
    ]);

    // Aggregate pallets out by date
    const palletsByDate: { [fecha: string]: { b2c: number; b2b: number } } = {};
    for (const p of palletsOut) {
      if (!palletsByDate[p.fecha]) palletsByDate[p.fecha] = { b2c: 0, b2b: 0 };
      if (p.tipo === 'B2C') palletsByDate[p.fecha].b2c += p.pallets;
      else palletsByDate[p.fecha].b2b += p.pallets;
    }

    // Build consolidated daily rows
    const allDates = new Set<string>([
      ...operaciones.map(o => o.fecha),
      ...Object.keys(palletsByDate),
    ]);

    const opsMap: { [f: string]: OperacionDiaria } = {};
    for (const o of operaciones) opsMap[o.fecha] = o;

    const jornalesMap: { [f: string]: number } = {};
    for (const j of jornales) jornalesMap[j.fecha] = j.jornales;

    const consolidated = Array.from(allDates).sort().map(fecha => ({
      fecha,
      picking: opsMap[fecha]?.picking ?? 0,
      pallets_in: opsMap[fecha]?.pallets_in ?? 0,
      contenedores: opsMap[fecha]?.contenedores ?? 0,
      pallets_out_b2c: palletsByDate[fecha]?.b2c ?? 0,
      pallets_out_b2b: palletsByDate[fecha]?.b2b ?? 0,
      jornales: jornalesMap[fecha] ?? 0,
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalDays: consolidated.length,
        totalPalletsOut: palletsOut.length,
        totalOperaciones: operaciones.length,
        totalJornales: jornales.length,
      },
      data: consolidated,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
