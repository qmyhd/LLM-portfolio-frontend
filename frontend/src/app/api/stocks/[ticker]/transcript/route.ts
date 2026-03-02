export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { TranscriptResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;
    const { searchParams } = new URL(request.url);
    const qs = new URLSearchParams();
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    if (year) qs.set('year', year);
    if (quarter) qs.set('quarter', quarter);
    const qsStr = qs.toString();

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/transcript${qsStr ? `?${qsStr}` : ''}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch transcript' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as TranscriptResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
