import { fetchAuthenticatedAPI, getStrapiURL } from "@/lib/api";
import { Order } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await fetchAuthenticatedAPI<Order[]>('/orders', {}, {
      populate: [
        'items',
        'items.itemType',
        'items.seat',
        'items.seat.section',
        'customer',
        'group'
      ]
    }, token.value);

    // Filter out orders that are not in the 'ok' or 'admin-new' status

    const filteredOrders = orders.filter(order => order.attributes.status === 'ok' || order.attributes.status === 'admin-new');
    
    return NextResponse.json(filteredOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(null, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const token = req.cookies.get('adminToken');
  if (!token) return NextResponse.json({ error: 'Kirjaudu sisään uudelleen.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Tilauksen tiedot ovat virheelliset.' }, { status: 400 });
  }

  try {
    const response = await fetch(getStrapiURL('/api/orders/createAdmin'), {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ data: body }),
    });
    const result = await response.json();
    if (!response.ok) {
      const error = response.status === 403
        ? 'Tilauksen luontioikeus puuttuu. Ota createAdmin käyttöön ylläpitäjän Strapi-roolille.'
        : response.status === 401 ? 'Kirjaudu sisään uudelleen.'
          : result.error?.message || 'Tilauksen luominen epäonnistui.';
      return NextResponse.json({ error }, { status: response.status });
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error creating admin order:', error);
    return NextResponse.json({ error: 'Tilauksen luominen epäonnistui.' }, { status: 500 });
  }
};
