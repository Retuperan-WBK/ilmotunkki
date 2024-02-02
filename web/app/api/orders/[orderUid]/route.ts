import { fetchAPI } from "@/lib/api";
import { Order } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
type Props = {
  params: {
    orderUid: string;
  }
}
export const GET = async (request: NextRequest, {params}: Props) => {
  const orderUid = params.orderUid;
  try {
    const response = await fetchAPI<Order>(`/orders/findByUid/${orderUid}`,{
      cache: 'no-store',
    });
    return NextResponse.json(response);
  } catch(error) {
    console.error(error);
    return NextResponse.json(null, {status: 404});
  }
}