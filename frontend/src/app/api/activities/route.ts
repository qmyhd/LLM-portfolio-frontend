export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ActivitiesResponse, ApiError } from '@/types/api';
import { backendFetch, requireRole } from '@/lib/api-client';
import { refreshRequested } from '@/lib/roles';
import { parseBucket } from '@/lib/bucket';

// GET /api/activities — proxy to backend GET /activities. All client query
// params pass through, except refresh, which is owner-only and re-set from the
// checked result; bucket is validated separately to surface
// 400s at the BFF tier rather than blame-mapping a backend rejection.
export async function GET(request: NextRequest) {
  try {
    // Any refresh that is not clearly off forces a backend recompute, which only the owner may trigger.
    const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh'));
    if (wantsRefresh) await requireRole('owner');
    else await requireRole('guest');

    const searchParams = request.nextUrl.searchParams;
    // Reject obviously bad bucket values here so the backend never has to.
    const bucketRaw = searchParams.get('bucket');
    if (bucketRaw && bucketRaw.toLowerCase() !== 'all' && !parseBucket(bucketRaw)) {
      return NextResponse.json(
        { error: `Invalid bucket: ${bucketRaw}` } as ApiError,
        { status: 400 },
      );
    }

    searchParams.delete('refresh');
    if (wantsRefresh) searchParams.set('refresh', 'true');
    const qs = searchParams.toString();
    const path = `/activities${qs ? `?${qs}` : ''}`;

    const response = await backendFetch(path, {
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch activities' } as ApiError,
        { status: response.status },
      );
    }

    const data: ActivitiesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
