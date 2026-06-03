export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/people/{id}/identities -> backend POST /people/{id}/identities
// Backend may return 409 (conflict) — forward status verbatim.
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;
    const body = await request.json();
    const response = await backendFetch(`/people/${id}/identities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to add identity' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
