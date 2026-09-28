import { NextRequest, NextResponse } from 'next/server';
import { fetchAPI } from '@/lib/api';

export const dynamic = 'force-dynamic';

type GlobalSettings = {
  attributes?: {
    mapScale?: number | null;
  };
};

export async function GET(req: NextRequest) {
  // Only allow signed-in admins to read settings through the admin API.
  const token = req.cookies.get('adminToken');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const global = await fetchAPI<GlobalSettings>('/global', { cache: 'no-store' });
    const mapScale = global?.attributes?.mapScale;

    return NextResponse.json({
      mapScale: typeof mapScale === 'number' && mapScale > 0 ? mapScale : 100,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching settings:', error);
    // Fall back to the default scale so the map still renders if settings are unreachable.
    return NextResponse.json({ mapScale: 100 }, { status: 200 });
  }
}
