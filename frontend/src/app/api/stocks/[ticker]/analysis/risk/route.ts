export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ConsensusReport, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/analysis/risk - Per-stock risk analysis
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();

    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') || 'false';

    const response = await backendFetch(
      `/stocks/${normalizedTicker}/analysis/risk?refresh=${refresh}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch risk analysis' } as ApiError,
        { status: response.status }
      );
    }

    const data: ConsensusReport = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Risk analysis fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
