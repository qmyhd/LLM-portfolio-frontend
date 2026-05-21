export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/sentiment/feed?limit=30&days=30
// Recent parsed-idea feed across all tickers — powers the home page.
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const params = new URLSearchParams();
    params.set('limit', request.nextUrl.searchParams.get('limit') || '30');
    params.set('days', request.nextUrl.searchParams.get('days') || '30');

    const response = await backendFetch(
      `/sentiment/feed?${params.toString()}`,
      // Cache 60s on the edge; feed turns over slowly
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch feed' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
