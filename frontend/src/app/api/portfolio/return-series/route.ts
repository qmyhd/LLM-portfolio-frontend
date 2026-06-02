export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

// GET /api/portfolio/return-series?period=1M&bucket=long_term
// Proxies to backend GET /portfolio/return-series (flow-free % return curve).
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const params = new URLSearchParams();
    params.set('period', request.nextUrl.searchParams.get('period') || '1M');
    forwardBucket(request, params);

    const response = await backendFetch(
      `/portfolio/return-series?${params.toString()}`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch return series' } as ApiError,
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
