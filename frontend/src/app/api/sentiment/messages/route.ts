import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, authGuard } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || '';
    const limit = searchParams.get('limit') || '20';
    const cursor = searchParams.get('cursor') || '0';

    const response = await backendFetch(
      `/sentiment/messages?ticker=${encodeURIComponent(ticker)}&limit=${encodeURIComponent(limit)}&cursor=${encodeURIComponent(cursor)}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch messages' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Sentiment messages fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' },
      { status: 502 }
    );
  }
}
