export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/types/api';
import { backendFetch, requireRole, seg } from '@/lib/api-client';

const ROLES = ['pending', 'guest', 'family', 'owner'];

// PATCH /api/users/{id} — change a user's role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole('owner');

    const body = await request.json().catch(() => null);
    if (!body || typeof body.role !== 'string' || !ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: 'Role must be pending, guest, family or owner.' } as ApiError,
        { status: 400 },
      );
    }

    const response = await backendFetch(`/users/${seg(params.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: body.role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to change the role' } as ApiError,
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('User role change error');
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}

// DELETE /api/users/{id} — remove a user (204, no body)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole('owner');

    const response = await backendFetch(`/users/${seg(params.id)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to delete the user' } as ApiError,
        { status: response.status },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('User delete error');
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 },
    );
  }
}
