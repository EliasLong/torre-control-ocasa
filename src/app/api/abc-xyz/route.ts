import { NextRequest, NextResponse } from 'next/server';
import { getAbcXyzData } from '@/services/abcxyz.service';

export async function GET(request: NextRequest) {
  try {
    const nave = request.nextUrl.searchParams.get('nave') || undefined;
    const data = await getAbcXyzData(nave);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in ABC-XYZ API:', error);
    return NextResponse.json(
      { error: 'Error fetching ABC-XYZ data' },
      { status: 500 },
    );
  }
}
