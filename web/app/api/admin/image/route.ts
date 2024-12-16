import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Extract the URL from the query parameter
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Build the full image URL by appending the image path to the Strapi base URL
    const fullImageUrl = `${process.env.STRAPI_API_URL}${imageUrl}`;

    // Fetch the image from the Strapi server
    const imageResponse = await fetch(fullImageUrl);

    if (!imageResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch image from Strapi' }, { status: 500 });
    }

    // Get the image's content type from the response headers
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
