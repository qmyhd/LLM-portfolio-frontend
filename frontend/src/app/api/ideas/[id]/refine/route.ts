export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { RefineResponse } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;

    // Forward apply query param if present
    const { searchParams } = new URL(request.url);
    const apply = searchParams.get('apply');
    const qs = apply === 'true' ? '?apply=true' : '';

    const response = await backendFetch(`/ideas/${id}/refine${qs}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to refine idea' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as RefineResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
