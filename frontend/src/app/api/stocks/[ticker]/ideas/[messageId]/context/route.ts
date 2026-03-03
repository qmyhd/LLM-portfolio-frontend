export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string; messageId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker, messageId } = await params;

    const response = await backendFetch(
      `/stocks/${ticker}/ideas/${messageId}/context`,
      { next: { revalidate: 300 } }, // 5 min cache — context doesn't change
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch idea context' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Failed to connect to backend' } as ApiError,
      { status: 502 },
    );
  }
}
