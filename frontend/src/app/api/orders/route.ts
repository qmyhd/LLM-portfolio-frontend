import { NextRequest, NextResponse } from 'next/server';
import type { OrdersResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/orders - Get recent orders
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const status = searchParams.get('status') || '';
    const ticker = searchParams.get('ticker') || '';

    // Build query string
    const params = new URLSearchParams();
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (ticker) params.set('ticker', ticker);

    const response = await backendFetch(`/orders?${params.toString()}`, {
      // Cache for 30 seconds
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Orders API error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch orders' } as ApiError,
        { status: response.status }
      );
    }

    const data: OrdersResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
