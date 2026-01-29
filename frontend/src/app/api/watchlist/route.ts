import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// Watchlist item from backend
interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface WatchlistResponse {
  items: WatchlistItem[];
}

interface ValidationResponse {
  ticker: string;
  valid: boolean;
  message: string;
}

// GET /api/watchlist - Get watchlist with current prices
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers') || '';
    
    if (!tickers) {
      return NextResponse.json({ items: [] });
    }
    
    const response = await backendFetch(
      `/watchlist?tickers=${encodeURIComponent(tickers)}`,
      {
        next: { revalidate: 30 }, // Refresh every 30 seconds for price updates
      }
    );
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Failed to fetch watchlist data',
        statusCode: response.status,
      }));
      return NextResponse.json(error, { status: response.status });
    }
    
    const data: WatchlistResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Watchlist error:', error);
    return NextResponse.json(
      { error: 'Watchlist service unavailable', statusCode: 503 },
      { status: 503 }
    );
  }
}

// POST /api/watchlist/validate - Validate ticker symbols
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    const body = await request.json();
    const { ticker } = body;
    
    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json(
        { error: 'Ticker symbol required', statusCode: 400 },
        { status: 400 }
      );
    }
    
    const response = await backendFetch('/watchlist/validate', {
      method: 'POST',
      body: JSON.stringify({ ticker }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: 'Validation failed',
        statusCode: response.status,
      }));
      return NextResponse.json(error, { status: response.status });
    }
    
    const data: ValidationResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Validation service unavailable', statusCode: 503 },
      { status: 503 }
    );
  }
}
