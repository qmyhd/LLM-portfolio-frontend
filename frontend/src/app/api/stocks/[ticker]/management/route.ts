import { NextRequest, NextResponse } from 'next/server';
import type { ManagementResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;

    const response = await backendFetch(
      `/stocks/${ticker.toUpperCase()}/management`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to fetch management' } as ApiError,
        { status: response.status }
      );
    }
    return NextResponse.json(await response.json() as ManagementResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Failed to connect to backend' } as ApiError, { status: 502 });
  }
}
