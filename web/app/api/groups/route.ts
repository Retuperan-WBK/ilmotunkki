import { fetchAPI, StrapiError } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';

type PostPayload = {
  code: string;
  orderUid: string;
}

export const POST = async (request: NextRequest) => {
  try {
    const payload = await request.json() as PostPayload;
    await fetchAPI('/group/createNew', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    const errorResponse = error as StrapiError;
    return NextResponse.json({ error: errorResponse.message }, { status: errorResponse.status || 500 });
  }
}

export const PUT = async (request: NextRequest) => {
  try {
    const payload = await request.json() as PostPayload;
    await fetchAPI('/group/addToOrder', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    const errorResponse = error as StrapiError;
    console.error(errorResponse);
    return NextResponse.json({ error: errorResponse.message }, { status: errorResponse.status || 500 });
  }
}

export const DELETE = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const orderUid = searchParams.get('orderUid');

    if (!code || !orderUid) {
      return NextResponse.json({ error: 'Missing code or orderUid' }, { status: 400 });
    }

    await fetchAPI(`/group/removeFromOrder?code=${code}&orderUid=${orderUid}`, {
      method: 'DELETE',
    });
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    const errorResponse = error as StrapiError;
    console.error(errorResponse);
    return NextResponse.json({ error: errorResponse.message }, { status: errorResponse.status || 500 });
  }
}