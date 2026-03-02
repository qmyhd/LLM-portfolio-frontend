import { NextRequest, NextResponse } from 'next/server';
import type { StockActivitiesResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/activities - Get stock trade activity history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify user is authenticated
    await authGuard();

    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    // Forward pagination query params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const response = await backendFetch(
      `/stocks/${normalizedTicker}/activities?limit=${limit}&offset=${offset}`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Stock activities ${normalizedTicker} API error:`, response.status, errorData);

      if (response.status === 404) {
        return NextResponse.json(
          { error: `No activities found for ${normalizedTicker}` } as ApiError,
          { status: 404 },
        );
      }

      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch stock activities' } as ApiError,
        { status: response.status },
      );
    }

    const data: StockActivitiesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Stock activities fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
