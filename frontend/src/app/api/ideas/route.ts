export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { UserIdeasResponse, UserIdea } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, requireRole } from '@/lib/api-client';
import { refreshRequested } from '@/lib/roles';

export async function GET(request: NextRequest) {
  try {
    // Any refresh that is not clearly off forces a backend recompute, which only the owner may trigger.
    const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh'));
    if (wantsRefresh) await requireRole('owner');
    else await requireRole('guest');

    // Forward all query params to the backend
    const { searchParams } = new URL(request.url);
    searchParams.delete('refresh');
    if (wantsRefresh) searchParams.set('refresh', 'true');
    const qs = searchParams.toString();
    const path = `/ideas${qs ? `?${qs}` : ''}`;

    const response = await backendFetch(path, { cache: 'no-store' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch ideas' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as UserIdeasResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('owner');
    const body = await request.json();

    const response = await backendFetch('/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to create idea' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as UserIdea, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
