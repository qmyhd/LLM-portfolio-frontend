export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

/** Human-correct labels, attribution, and 13F bucketing for an NLP idea. */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authGuard();
    const body = await request.json();

    const response = await backendFetch(`/ideas/discord-parsed/${params.id}/curation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to update curation' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
