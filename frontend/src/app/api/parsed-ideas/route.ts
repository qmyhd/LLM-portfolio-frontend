export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ParsedIdeasListResponse } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

/** Parsed Discord ideas with their source message, for the review queue. */
export async function GET(request: NextRequest) {
  try {
    await authGuard();

    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const path = `/ideas/discord-parsed${qs ? `?${qs}` : ''}`;

    const response = await backendFetch(path, { cache: 'no-store' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch parsed ideas' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as ParsedIdeasListResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
