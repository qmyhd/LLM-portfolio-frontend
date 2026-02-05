import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

/**
 * OHLCV Chart Data API
 * 
 * Fetches OHLCV data from backend (which queries Supabase ohlcv_daily table)
 * and returns it in TradingView compatible format.
 * 
 * Query params:
 *   - symbol: Ticker symbol (required)
 *   - from: Start date ISO string (optional, default: 1 year ago)
 *   - to: End date ISO string (optional, default: today)
 *   - resolution: '1D' | '1W' | '1M' (optional, default: '1D')
 */

interface OHLCVBar {
  time: number; // Unix timestamp in seconds for TradingView
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BackendOHLCVResponse {
  symbol: string;
  bars: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  meta?: {
    source: string;
    count: number;
  };
}

// GET /api/chart-data?symbol=AAPL&from=2025-01-01&to=2026-02-05
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const resolution = searchParams.get('resolution') || '1D';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbol' } as ApiError,
        { status: 400 }
      );
    }

    // Calculate default date range (1 year)
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Build query string for backend
    const queryParams = new URLSearchParams({
      start: fromDate.toISOString().split('T')[0],
      end: toDate.toISOString().split('T')[0],
    });

    // Fetch from backend API - /stocks/{ticker}/ohlcv endpoint
    const response = await backendFetch(`/stocks/${symbol.toUpperCase()}/ohlcv?${queryParams.toString()}`, {
      // Cache for 5 minutes (data updates nightly)
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      // If backend returns 404, try to return empty data gracefully
      if (response.status === 404) {
        return NextResponse.json({
          s: 'no_data',
          symbol: symbol.toUpperCase(),
          bars: [],
        });
      }

      const errorData = await response.json().catch(() => ({}));
      console.error('OHLCV API error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch OHLCV data' } as ApiError,
        { status: response.status }
      );
    }

    const data: BackendOHLCVResponse = await response.json();

    // Transform to TradingView format
    const bars: OHLCVBar[] = data.bars.map((bar) => ({
      time: Math.floor(new Date(bar.date).getTime() / 1000), // Convert to Unix seconds
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }));

    // Sort by time ascending (TradingView requirement)
    bars.sort((a, b) => a.time - b.time);

    return NextResponse.json({
      s: 'ok',
      symbol: symbol.toUpperCase(),
      bars,
      meta: {
        source: data.meta?.source || 'databento',
        count: bars.length,
        resolution,
      },
    });
  } catch (error) {
    console.error('Chart data fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
