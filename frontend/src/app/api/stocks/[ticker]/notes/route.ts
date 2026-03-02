export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { NotesResponse, StockNote, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/notes`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch notes' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as NotesResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const body = await request.json();

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/notes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to create note' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as StockNote, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const body = await request.json();
    const noteId = body.id;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' } as ApiError,
        { status: 400 }
      );
    }

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/notes/${noteId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to delete note' } as ApiError,
        { status: response.status }
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
