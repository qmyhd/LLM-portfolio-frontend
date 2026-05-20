export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { PortfolioRiskReport, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

// GET /api/portfolio/risk - Portfolio-wide risk analysis
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    params.set('refresh', searchParams.get('refresh') || 'false');
    forwardBucket(request, params);

    const response = await backendFetch(`/portfolio/risk?${params.toString()}`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch portfolio risk' } as ApiError,
        { status: response.status }
      );
    }

    const data: PortfolioRiskReport = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Portfolio risk fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
