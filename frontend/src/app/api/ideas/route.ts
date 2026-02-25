import { NextRequest, NextResponse } from 'next/server';
import type { UserIdeasResponse, UserIdea } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  try {
    await authGuard();

    // Forward all query params to the backend
    const { searchParams } = new URL(request.url);
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
    await authGuard();
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
