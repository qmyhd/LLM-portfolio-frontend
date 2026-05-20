export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';
import { forwardBucket } from '@/lib/bucket';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await authGuard();
    const { ticker } = await params;

    const body = await request.json();

    // Bucket scopes only the position context fed to the LLM. Forward via
    // query string since the backend reads it from there (POST + query is
    // valid HTTP and matches the backend's signature).
    const qs = new URLSearchParams();
    forwardBucket(request, qs);
    const qsStr = qs.toString();

    const response = await backendFetch(
      `/stocks/${ticker}/chat${qsStr ? `?${qsStr}` : ''}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

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
