import { fetchAPI, fetchAuthenticatedAPI } from "@/lib/api";
import { Customer, Order } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';


export const POST = async () => {
  try {
    const newOrder = await fetchAPI<Order>('/orders',{
      method: 'POST',
      body: JSON.stringify({
        data: {}
      }),
    });
    const newCustomer = await fetchAPI<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          orders: [newOrder.id]
        }
      }),
    });
    newOrder.attributes.customer = {data: newCustomer};
    return NextResponse.json(newOrder);
  } catch(error) {
    console.error(error);
    return NextResponse.json(null,{status: 500})
  }
}

export const GET = async (req: NextRequest) => {
  try {
    const token = req.cookies.get('adminToken');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await fetchAuthenticatedAPI<Order[]>('/orders', {}, {}, token.value);
    
    return NextResponse.json(orders);
  } catch(error) {
    console.error(error);
    return NextResponse.json(null,{status: 500});
  }
}