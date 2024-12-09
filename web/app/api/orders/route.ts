import { fetchAPI } from "@/lib/api";
import { Customer, Order } from "@/utils/models";
import {  NextResponse } from "next/server";
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