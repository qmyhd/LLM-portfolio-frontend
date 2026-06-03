export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/people/{id} -> backend GET /people/{id}
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;
    const response = await backendFetch(`/people/${id}`, { cache: 'no-store' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch person' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

// PUT /api/people/{id} -> backend PUT /people/{id}
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;
    const body = await request.json();
    const response = await backendFetch(`/people/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to update person' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

// DELETE /api/people/{id} -> backend DELETE /people/{id}
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { id } = await params;
    const response = await backendFetch(`/people/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to delete person' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
