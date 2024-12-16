import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthenticatedAPI } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemTypes = await fetchAuthenticatedAPI('/item-types', {
      method: 'GET'
    }, {}, token.value);

    return NextResponse.json(itemTypes, { status: 200 });

  } catch (error) {
    console.error('Error fetching item types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
