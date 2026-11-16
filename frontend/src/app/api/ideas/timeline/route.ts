export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { TimelineResponse } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, requireRole } from '@/lib/api-client';
import { refreshRequested } from '@/lib/roles';

/** Chronological story/timeline view across imported and journal ideas. */
export async function GET(request: NextRequest) {
  try {
    // Any refresh that is not clearly off forces a backend recompute, which only the owner may trigger.
    const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh'));
    if (wantsRefresh) await requireRole('owner');
    else await requireRole('guest');

    const { searchParams } = new URL(request.url);
    searchParams.delete('refresh');
    if (wantsRefresh) searchParams.set('refresh', 'true');
    const qs = searchParams.toString();
    const path = `/ideas/timeline${qs ? `?${qs}` : ''}`;

    const response = await backendFetch(path, { cache: 'no-store' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch timeline' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as TimelineResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
