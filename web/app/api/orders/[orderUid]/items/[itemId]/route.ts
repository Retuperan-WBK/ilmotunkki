import { fetchAPI } from "@/lib/api";
import { Item } from "@/utils/models";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
type Props = {
  params: {
    orderUid: string,
    itemId: string,
  }
}
export const DELETE = async (request: NextRequest, {params}: Props) => {
  const {orderUid, itemId} = params;
  try {
    const removeResult = await fetchAPI<Item>(`/items/${itemId}`, {
      method: 'DELETE',
    },
    {
      orderUid,
    });
    return NextResponse.json(removeResult)
  } catch(error) {
    console.error(error);
    return NextResponse.json(null, {status: 500})
  }
}

