import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = searchParams.get('limit') || '10';
    
    if (!query || query.length < 1) {
      return NextResponse.json({ results: [], query: '', total: 0 });
    }
    
    const response = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: { 'Content-Type': 'application/json' },
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
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search service unavailable', status: 503 } as ApiError,
      { status: 503 }
    );
  }
}
