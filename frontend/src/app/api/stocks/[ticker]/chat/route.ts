export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;

    const body = await request.json();

    const response = await backendFetch(`/stocks/${ticker}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail || 'Failed to get chat response' } as ApiError,
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json() as ChatResponse);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json(
      { error: 'Failed to connect to backend' } as ApiError,
      { status: 502 }
    );
  }
}
