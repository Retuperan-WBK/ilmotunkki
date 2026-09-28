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

    // Only send the fields that were provided so partial updates (e.g. dragging a
    // seat) do not clear unrelated fields such as item_type or special.
    const data: Record<string, unknown> = {};
    if ('x_cord' in body) data.x_cord = body.x_cord;
    if ('y_cord' in body) data.y_cord = body.y_cord;
    if ('Row' in body) data.Row = body.Row;
    if ('Number' in body) data.Number = body.Number;
    if ('item_type' in body) data.item_type = body.item_type || null;
    if ('special' in body) data.special = body.special || null;

    const payload = { data };

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
    const e = error as { status?: number; message?: string };
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: e?.status ?? 500 });
  }
}
