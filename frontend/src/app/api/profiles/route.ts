export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

// GET /api/profiles?queue=1&bucket=long_term -> backend GET /profiles
export async function GET(request: NextRequest) {
  try {
    await authGuard();
    const qs = new URLSearchParams();
    const queue = request.nextUrl.searchParams.get('queue');
    if (queue) qs.set('queue', queue);
    forwardBucket(request, qs);
    const s = qs.toString();
    const response = await backendFetch(`/profiles${s ? `?${s}` : ''}`, { cache: 'no-store' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch profiles' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
