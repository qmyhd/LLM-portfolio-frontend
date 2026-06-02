export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const qs = new URLSearchParams();
    forwardBucket(request, qs);
    const s = qs.toString();
    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/profile/revisions${s ? `?${s}` : ''}`,
      { cache: 'no-store' },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch revisions' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
