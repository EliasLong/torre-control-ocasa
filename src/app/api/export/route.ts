import { NextRequest, NextResponse } from 'next/server';
import { sheetsService } from '@/services/sheets.service';

const VALID_SHEETS = ['operacional', 'financiero', 'tarifas', 'costos', 'objetivos', 'merma', 'torre_control'];

export async function GET(request: NextRequest) {
  try {
    const sheet = request.nextUrl.searchParams.get('sheet');

    if (!sheet || !VALID_SHEETS.includes(sheet)) {
      return NextResponse.json(
        { error: `Invalid sheet. Valid options: ${VALID_SHEETS.join(', ')}` },
        { status: 400 }
      );
    }

    const rows = await sheetsService.getSheetRaw(sheet);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // Convert rows to CSV
    const csv = rows
      .map(row =>
        row.map(cell => {
          const val = String(cell ?? '');
          // Escape cells containing commas, quotes, or newlines
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
      .join('\n');

    // Add BOM for Excel compatibility with UTF-8
    const bom = '\uFEFF';

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${sheet}_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Error exporting data' }, { status: 500 });
  }
}
