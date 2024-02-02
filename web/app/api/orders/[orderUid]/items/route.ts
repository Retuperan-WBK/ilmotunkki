import { fetchAPI } from "@/lib/api";
import { Item } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
type Props = {
  params: {
    orderUid: string;
  }
}
type PostPayload = {
  itemType: number;
}

export const POST = async (request: NextRequest, {params}: Props) => {
  const {orderUid} = params;
  try {
    const payload = await request.json() as PostPayload
    const newItem = await fetchAPI<Item>('/items', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          itemType: payload.itemType,
          order: orderUid,
        }
      }),
    });
    return NextResponse.json(newItem)
  } catch(error) {
    console.error(error);
    return NextResponse.json(null, {status: 500})
  }
}