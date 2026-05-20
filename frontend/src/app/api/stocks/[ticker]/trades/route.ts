export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { EnrichedTradesResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/trades - Get enriched trades for a stock
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify user is authenticated
    await authGuard();

    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    // Forward query params
    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    qs.set('limit', searchParams.get('limit') || '20');
    const offset = searchParams.get('offset');
    if (offset) qs.set('offset', offset);
    forwardBucket(request, qs);

    const response = await backendFetch(
      `/stocks/${normalizedTicker}/trades?${qs.toString()}`,
      { next: { revalidate: 30 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Stock trades ${normalizedTicker} API error:`, response.status, errorData);

      if (response.status === 404) {
        return NextResponse.json(
          { error: `No trades found for ${normalizedTicker}` } as ApiError,
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch stock trades' } as ApiError,
        { status: response.status },
      );
    }

    const data: EnrichedTradesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Stock trades fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
