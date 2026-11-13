export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, requireRole, seg } from '@/lib/api-client';

// POST /api/users/{id}/password — set a new password (204, no body).
// The body carries a password: forwarded as typed, never logged.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole('owner');

    const body = await request.json().catch(() => null);
    if (!body || typeof body.password !== 'string') {
      return NextResponse.json(
        { error: 'Send a password.' } as ApiError,
        { status: 400 },
      );
    }

    const response = await backendFetch(`/users/${seg(params.id)}/password`, {
      method: 'POST',
      body: JSON.stringify({ password: body.password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to change the password' } as ApiError,
        { status: response.status },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('User password change error');
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
