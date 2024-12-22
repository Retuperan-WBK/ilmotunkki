import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthenticatedAPI } from '@/lib/api';

/**
 * Handle PUT request to update a seat by ID
 */
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seatId = req.nextUrl.pathname.split('/').pop();
    const body = await req.json();

    const payload = {
      data: {
        x_cord: body.x_cord,
        y_cord: body.y_cord,
        Row: body.Row,
        Number: body.Number,
        item_type: body.item_type || null,
      }
    };

    const response = await fetchAuthenticatedAPI(`/seats/${seatId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, {}, token.value);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating seat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Handle DELETE request to delete a seat by ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seatId = req.nextUrl.pathname.split('/').pop();
    
    const response = await fetchAuthenticatedAPI(`/seats/${seatId}`, {
      method: 'DELETE',
    }, {}, token.value);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting seat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
