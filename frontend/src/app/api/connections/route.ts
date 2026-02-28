import { NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/connections — List brokerage connections with status
export async function GET() {
  try {
    await authGuard();

    const response = await backendFetch('/connections');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch connections' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Connections fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
