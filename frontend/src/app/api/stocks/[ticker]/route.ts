import { NextRequest, NextResponse } from 'next/server';
import type { StockProfileCurrent, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker] - Get stock profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify user is authenticated
    await authGuard();

    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    const response = await backendFetch(`/stocks/${normalizedTicker}`, {
      // Cache for 60 seconds
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Stock ${normalizedTicker} API error:`, response.status, errorData);

      if (response.status === 404) {
        return NextResponse.json(
          { error: `Stock ${normalizedTicker} not found` } as ApiError,
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch stock profile' } as ApiError,
        { status: response.status }
      );
    }

    const data: StockProfileCurrent = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Stock profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
