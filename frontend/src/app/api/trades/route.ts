export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { EnrichedTradesResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/trades - Get recent enriched trades across all stocks
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    // Forward query params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const response = await backendFetch(
      `/trades/recent?limit=${limit}`,
      { next: { revalidate: 30 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Recent trades API error:', response.status, errorData);

      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch recent trades' } as ApiError,
        { status: response.status },
      );
    }

    const data: EnrichedTradesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Recent trades fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
