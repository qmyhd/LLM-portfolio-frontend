export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/{ticker}/topic-tags -> backend GET /stocks/{ticker}/topic-tags
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const response = await backendFetch(`/stocks/${ticker}/topic-tags`, { cache: 'no-store' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch topic tags' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

// PUT /api/stocks/{ticker}/topic-tags -> backend PUT /stocks/{ticker}/topic-tags
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const body = await request.json();
    const response = await backendFetch(`/stocks/${ticker}/topic-tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to update topic tags' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
