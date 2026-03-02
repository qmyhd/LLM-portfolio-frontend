export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/sentiment?ticker=NVDA&window=30d - Get sentiment summary
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || '';
    const window = searchParams.get('window') || '30d';

    const response = await backendFetch(
      `/sentiment/summary?ticker=${encodeURIComponent(ticker)}&window=${encodeURIComponent(window)}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch sentiment data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Sentiment fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' },
      { status: 502 }
    );
  }
}
