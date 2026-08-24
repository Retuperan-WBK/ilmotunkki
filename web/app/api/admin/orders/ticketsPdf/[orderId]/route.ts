import { NextRequest, NextResponse } from 'next/server';
import { getStrapiURL } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  const token = req.cookies.get('adminToken');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(getStrapiURL(`/api/orders/ticketsPdf/${orderId}`), {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate ticket PDF' },
        { status: response.status }
      );
    }

    const pdf = await response.arrayBuffer();

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="tilaus-${orderId}-liput.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error in ticketsPdf route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
