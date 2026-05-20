export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { MoversResponse } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    params.set('limit', searchParams.get('limit') || '10');
    forwardBucket(request, params);

    const response = await backendFetch(`/portfolio/movers?${params.toString()}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch movers' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as MoversResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
