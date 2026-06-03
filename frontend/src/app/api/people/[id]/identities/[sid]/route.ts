export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ id: string; sid: string }>;
}

// DELETE /api/people/{id}/identities/{sid} -> backend DELETE /people/{id}/identities/{sid}
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id, sid } = await params;
    const response = await backendFetch(`/people/${id}/identities/${sid}`, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to delete identity' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
