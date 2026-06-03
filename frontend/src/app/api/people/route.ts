export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/people?status=&category=&tier= -> backend GET /people
export async function GET(request: NextRequest) {
  try {
    await authGuard();
    const qs = new URLSearchParams();
    const status = request.nextUrl.searchParams.get('status');
    const category = request.nextUrl.searchParams.get('category');
    const tier = request.nextUrl.searchParams.get('tier');
    if (status) qs.set('status', status);
    if (category) qs.set('category', category);
    if (tier) qs.set('tier', tier);
    const s = qs.toString();
    const response = await backendFetch(`/people${s ? `?${s}` : ''}`, { cache: 'no-store' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch people' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}

// POST /api/people -> backend POST /people
export async function POST(request: NextRequest) {
  try {
    await authGuard();
    const body = await request.json();
    const response = await backendFetch('/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to create person' } as ApiError,
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
