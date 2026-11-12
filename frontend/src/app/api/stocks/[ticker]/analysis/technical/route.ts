export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ConsensusReport, ApiError } from '@/types/api';
import { backendFetch, requireRole, seg } from '@/lib/api-client';
import { refreshRequested } from '@/lib/roles';
import { forwardBucket } from '@/lib/bucket';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/analysis/technical - Technical analysis only
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Any refresh that is not clearly off forces a backend recompute, which only the owner may trigger.
    const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh'));
    if (wantsRefresh) await requireRole('owner');
    else await requireRole('guest');

    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    const qs = new URLSearchParams();
    qs.set('refresh', wantsRefresh ? 'true' : 'false');
    forwardBucket(request, qs);

    const response = await backendFetch(
      `/stocks/${seg(normalizedTicker)}/analysis/technical?${qs.toString()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch technical analysis' } as ApiError,
        { status: response.status }
      );
    }

    const data: ConsensusReport = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Technical analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
