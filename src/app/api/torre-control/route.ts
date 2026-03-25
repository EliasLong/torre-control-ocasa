import { NextRequest, NextResponse } from 'next/server';
import { sheetsService } from '@/services/sheets.service';

export async function GET(request: NextRequest) {
  try {
    const fecha = request.nextUrl.searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    const data = await sheetsService.getTorreControlData(fecha);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in torre-control API:', error);
    return NextResponse.json({ error: 'Error fetching torre-control data' }, { status: 500 });
  }
}
