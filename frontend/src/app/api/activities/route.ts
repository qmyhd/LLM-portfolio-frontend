export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ActivitiesResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { parseBucket } from '@/lib/bucket';

// GET /api/activities — proxy to backend GET /activities. All client query
// params pass through verbatim; bucket is validated separately to surface
// 400s at the BFF tier rather than blame-mapping a backend rejection.
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const incoming = request.nextUrl.searchParams;
    // Reject obviously bad bucket values here so the backend never has to.
    const bucketRaw = incoming.get('bucket');
    if (bucketRaw && bucketRaw.toLowerCase() !== 'all' && !parseBucket(bucketRaw)) {
      return NextResponse.json(
        { error: `Invalid bucket: ${bucketRaw}` } as ApiError,
        { status: 400 },
      );
    }

    const qs = incoming.toString();
    const path = `/activities${qs ? `?${qs}` : ''}`;

    const response = await backendFetch(path, {
      next: { revalidate: 30 },
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
