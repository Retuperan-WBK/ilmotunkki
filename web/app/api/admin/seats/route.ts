import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthenticatedAPI } from '@/lib/api';

// **Create a Seat**
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const payload = {
      data: {
        section: body.sectionId,
        x_cord: body.x_cord,
        y_cord: body.y_cord,
        Row: body.Row,
        Number: body.Number,
        special: body.special || null, 
        itemType: body.itemType || null 
      }
    };

    const response = await fetchAuthenticatedAPI('/seats', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, {}, token.value);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating seat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// **Update a Seat**
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const seatId = req.nextUrl.pathname.split('/').pop();

    const payload = {
      data: {
        x_cord: body.x_cord,
        y_cord: body.y_cord,
        Row: body.Row,
        Number: body.Number,
        special: body.special || null, 
        itemType: body.itemType || null 
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

// **Delete a Seat**
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
