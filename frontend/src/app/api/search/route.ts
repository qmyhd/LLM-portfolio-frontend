import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// Response types for search
interface SearchResult {
  symbol: string;
  name: string;
  sector: string;
  type: 'stock' | 'etf';
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}

// GET /api/search - Search for stocks/tickers
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '10';
    
    if (!query || query.length < 1) {
      return NextResponse.json({ results: [], query: '', total: 0 });
    }
    
    const response = await backendFetch(
      `/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        next: { revalidate: 60 }, // Cache for 1 minute (symbol data is static)
      }
    );
    
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'Search failed',
        status: response.status,
      }));
      return NextResponse.json(error, { status: response.status });
    }
    
    const data: SearchResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search service unavailable', status: 503 } as ApiError,
      { status: 503 }
    );
  }
}
