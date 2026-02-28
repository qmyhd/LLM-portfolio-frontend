import { NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// POST /api/connections/portal — Generate SnapTrade Connect redirect URL
export async function POST() {
  try {
    await authGuard();

    const response = await backendFetch('/connections/portal', {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to generate portal URL' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Portal URL error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
