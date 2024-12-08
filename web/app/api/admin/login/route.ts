
import { fetchLoginApi } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';

type LoginResponse = {
  jwt: string;
  user: {
    id: number;
    email: string;
    username: string;
    confirmed: boolean;
    blocked: boolean;
    role: {
      id: number;
      name: string;
      description: string;
      type: string;
    };
    createdAt: string;
    updatedAt: string;
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const data = await fetchLoginApi('/auth/local', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, password }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as LoginResponse;

    if (!data.jwt) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Store token in an HttpOnly cookie for security
    const response = NextResponse.json({ jwt: data.jwt, user: data.user }, { status: 200 });

    response.cookies.set('adminToken', data.jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;

  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
