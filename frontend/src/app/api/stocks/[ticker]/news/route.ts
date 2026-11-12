export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { NewsResponse, ApiError } from '@/types/api';
import { backendFetch, requireRole, seg } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole('guest');
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const response = await backendFetch(
      `/stocks/${seg(ticker.toUpperCase())}/news?limit=${limit}`,
      { cache: 'no-store'}
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch news' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as NewsResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
