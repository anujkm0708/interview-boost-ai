import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.JOOBLE_API_KEY || 'b3948457-7af4-4bdb-8ea0-32f68dd05722';
    const body = await request.json().catch(() => ({}));
    const { keywords, location, page } = body;

    const response = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: keywords || 'Software Engineer',
        location: location || '',
        page: page || '1',
        ResultOnPage: '12',
      }),
    });

    if (!response.ok) {
      throw new Error(`Jooble API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Fetch recent jobs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch jobs' }, { status: 500 });
  }
}
