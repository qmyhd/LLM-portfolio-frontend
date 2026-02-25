import { NextRequest, NextResponse } from 'next/server';
import type { UserIdea } from '@/types/ideas';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;
    const body = await request.json();

    const response = await backendFetch(`/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to update idea' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as UserIdea);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;

    const response = await backendFetch(`/ideas/${id}`, { method: 'DELETE' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to delete idea' } as ApiError,
        { status: response.status }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
