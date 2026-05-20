export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ConsensusReport, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/analysis - Multi-agent stock analysis
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();

    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    qs.set('refresh', searchParams.get('refresh') || 'false');
    const agents = searchParams.get('agents');
    if (agents) qs.set('agents', agents);
    forwardBucket(request, qs);

    const response = await backendFetch(
      `/stocks/${normalizedTicker}/analysis?${qs.toString()}`,
      { next: { revalidate: 60 } },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch analysis' } as ApiError,
        { status: response.status }
      );
    }

    const data: ConsensusReport = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
