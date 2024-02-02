import { NextRequest, NextResponse } from "next/server";
import paytrailService from "@/utils/paytrail";
import { updateOrderState } from '@/utils/helpers';
export const dynamic = 'force-dynamic';

// This is called by paytrail directly
export const GET = async (request: NextRequest) => {
  const query = request.nextUrl.searchParams;
  const queryObject = Object.fromEntries(query.entries())
  try {
    const result = paytrailService.verifyPayment(queryObject);
    if (!result) return NextResponse.json({}, {status: 400});
    await updateOrderState(
      Number(queryObject['checkout-reference']),
      queryObject['checkout-status'] || 'fail',
      queryObject['checkout-transaction-id'] || undefined,
      );
    return NextResponse.json({}, {status: 200});
  } catch(error) {
    console.error(error);
    return NextResponse.json(null, {status: 500});
  }
}
