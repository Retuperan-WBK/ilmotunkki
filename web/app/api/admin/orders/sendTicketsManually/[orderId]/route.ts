import { NextRequest, NextResponse } from 'next/server';
import { fetchAuthenticatedAPI } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  const token = req.cookies.get('adminToken');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = {
    data: {}
  };

  try {
    // Send a POST request to the custom Strapi controller
    const response = await fetchAuthenticatedAPI<boolean>(
      `/orders/sendTicketsManually/${orderId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }, {}, token.value
    );

    return NextResponse.json({response: response}, { status: 200 });
  } catch (error) {
    console.error('Error in sendTickets route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
