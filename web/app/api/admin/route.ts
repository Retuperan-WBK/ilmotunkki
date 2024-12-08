import { NextRequest, NextResponse } from 'next/server';
import { fetchStrapi } from '@/lib/fetchStrapi';

export const POST = async (request: NextRequest) => {
  try {
    // Extract JWT from request body
    const { jwt } = await request.json() as { jwt: string };

    if (!jwt) {
      return NextResponse.json({ error: 'Missing JWT in request body' }, { status: 400 });
    }

    // Call the fetchAPI function to proxy the request to Strapi
    const userData = await fetchStrapi('/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      }
    });

    // Return user data as JSON
    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
