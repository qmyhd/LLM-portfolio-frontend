export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

function withBucketQs(path: string, request: NextRequest): string {
  const qs = new URLSearchParams();
  forwardBucket(request, qs);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const response = await backendFetch(
      withBucketQs(`/stocks/${ticker.toUpperCase()}/profile`, request),
      { cache: 'no-store' },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch profile' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const body = await request.json();
    const response = await backendFetch(
      withBucketQs(`/stocks/${ticker.toUpperCase()}/profile`, request),
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to save profile' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const response = await backendFetch(
      withBucketQs(`/stocks/${ticker.toUpperCase()}/profile`, request),
      { method: 'DELETE' },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to delete profile' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
