import { NextRequest, NextResponse } from 'next/server';
import type { OHLCVSeries, ApiError } from '@/types/api';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/ohlcv - Get OHLCV data with orders for charting
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '1M';

    const response = await fetch(
      `${API_URL}/stocks/${normalizedTicker}/ohlcv?period=${period}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 5 minutes (OHLCV data updates less frequently)
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`OHLCV for ${normalizedTicker} API error:`, response.status, errorData);

      if (response.status === 404) {
        return NextResponse.json(
          { error: `No OHLCV data for ${normalizedTicker}` } as ApiError,
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch OHLCV data' } as ApiError,
        { status: response.status }
      );
    }

    const data: OHLCVSeries = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('OHLCV fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
