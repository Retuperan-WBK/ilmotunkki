import { fetchAuthenticatedAPI } from "@/lib/api";
import { Order } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server";

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