export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { NewsResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/news?limit=${limit}`,
      { next: { revalidate: 300 } }
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
