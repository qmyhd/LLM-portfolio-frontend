export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

// GET /api/portfolio/equity-curve?days=90&bucket=long_term
// Proxies to backend GET /portfolio/equity-curve for the daily equity time-series.
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const params = new URLSearchParams();
    params.set('days', request.nextUrl.searchParams.get('days') || '90');
    forwardBucket(request, params);

    const response = await backendFetch(
      `/portfolio/equity-curve?${params.toString()}`,
      // 5-minute edge cache — equity curves only change once a day after
      // the nightly snapshot pipeline runs.
      { next: { revalidate: 300 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch equity curve' } as ApiError,
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
