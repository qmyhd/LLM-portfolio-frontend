export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, requireRole } from '@/lib/api-client';

const CREATE_ROLES = ['guest', 'family', 'owner'];

// GET /api/users — everyone who has signed in, pending first
export async function GET() {
  try {
    await requireRole('owner');

    const response = await backendFetch('/users');

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch users' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Users fetch error');
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}

// POST /api/users — create a password account. The body carries a password:
// it is forwarded as typed and never logged.
export async function POST(request: NextRequest) {
  try {
    await requireRole('owner');

    const body = await request.json().catch(() => null);
    if (
      !body ||
      typeof body.username !== 'string' ||
      typeof body.password !== 'string' ||
      typeof body.role !== 'string' ||
      !CREATE_ROLES.includes(body.role)
    ) {
      return NextResponse.json(
        { error: 'Send a username, a password and a role (guest, family or owner).' } as ApiError,
        { status: 400 },
      );
    }

    const response = await backendFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        username: body.username,
        password: body.password,
        role: body.role,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to create the account' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json(), { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('User create error');
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
