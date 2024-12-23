import { fetchAuthenticatedAPI } from '@/lib/api';
import { Section } from '@/utils/models';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await fetchAuthenticatedAPI<Section[]>('/sections', {
      method: 'GET'
    }, {
      populate: [
        'seats',
        'seats.item_type',
        'seats.item',
        'seats.item.itemType',
        'seats.item.order',
        'seats.item.order.group',
        'background_image'
      ]
    }, token.value);

    return NextResponse.json(sections, { status: 200 });

  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
