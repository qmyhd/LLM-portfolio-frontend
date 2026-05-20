export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { SparklineResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

// GET /api/sparklines?period=1M&bucket=long_term — proxy to backend GET /portfolio/sparklines
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const params = new URLSearchParams();
    params.set('period', request.nextUrl.searchParams.get('period') || '1M');
    forwardBucket(request, params);

    const response = await backendFetch(`/portfolio/sparklines?${params.toString()}`, {
      next: { revalidate: 300 }, // Cache 5 minutes
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch sparklines' } as ApiError,
        { status: response.status },
      );
    }

    const data: SparklineResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
