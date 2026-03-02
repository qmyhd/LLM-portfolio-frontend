export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { FilingsResponse, ApiError } from '@/types/api';
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
    const formType = searchParams.get('form_type');
    const limit = searchParams.get('limit');
    if (formType) qs.set('form_type', formType);
    if (limit) qs.set('limit', limit);
    const qsStr = qs.toString();

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/filings${qsStr ? `?${qsStr}` : ''}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch filings' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as FilingsResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
