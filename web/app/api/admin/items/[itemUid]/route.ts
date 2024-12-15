import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthenticatedAPI } from '@/lib/api';
import { Item } from '@/utils/models';

/**
 * **Add Ticket to Seat**
 * URL: /api/admin/item/[uid]/assign-seat
 * Method: POST
 * Body: { seatId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = req.nextUrl.pathname.split('/').filter(Boolean).pop();
    const body = await req.json();

    const payload = {
      seat: body.seatId
    };

    const response = await fetchAuthenticatedAPI<Item>(`/items/${uid}/assign-seat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {}, token.value);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding ticket to seat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * **Remove Ticket from Seat**
 * URL: /api/admin/item/[uid]/remove-seat
 * Method: POST
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = req.nextUrl.pathname.split('/').filter(Boolean).pop();

    const response = await fetchAuthenticatedAPI<Item>(`/items/${uid}/remove-seat`, {
      method: 'DELETE',
    }, {}, token.value);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error removing ticket from seat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * **Change Ticket from Seat to Another**
 * URL: /api/admin/item/[uid]/change-seat
 * Method: POST
 * Body: { seatId: number }
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uid = req.nextUrl.pathname.split('/').filter(Boolean).pop();
    const body = await req.json();

    const payload = {
      seat: body.seatId
    };

    const response = await fetchAuthenticatedAPI<Item>(`/items/${uid}/change-seat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {}, token.value);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error changing ticket to new seat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
