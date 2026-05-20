export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { parseBucket } from '@/lib/bucket';

// GET /api/connections — List brokerage connections with status + bucket
export async function GET() {
  try {
    await authGuard();

    const response = await backendFetch('/connections');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch connections' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Connections fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}

// PATCH /api/connections — accepts { accountId, bucket } and proxies to
// the backend /connections/{accountId}/bucket endpoint. Co-located here
// (rather than a dynamic [accountId] route) to keep the Settings UI's
// call surface flat.
export async function PATCH(request: NextRequest) {
  try {
    await authGuard();

    const body = await request.json().catch(() => ({}));
    const accountId = typeof body.accountId === 'string' ? body.accountId : '';
    // Defense in depth: validate the bucket here too. `parseBucket` returns
    // null for empty/'all' (which is NOT a valid bucket assignment) or any
    // unrecognized value, so we reject those before touching the backend.
    const bucket = parseBucket(typeof body.bucket === 'string' ? body.bucket : null);

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' } as ApiError,
        { status: 400 },
      );
    }
    if (!bucket) {
      return NextResponse.json(
        { error: "Invalid bucket. Must be one of: long_term, swing, day, retirement, other." } as ApiError,
        { status: 400 },
      );
    }

    const response = await backendFetch(
      `/connections/${encodeURIComponent(accountId)}/bucket`,
      {
        method: 'PATCH',
        body: JSON.stringify({ bucket }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to update bucket' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Bucket update error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
