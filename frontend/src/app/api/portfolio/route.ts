import { NextRequest, NextResponse } from 'next/server';
import type { PortfolioResponse, ApiError } from '@/types/api';
import { backendFetch, authGuard } from '@/lib/api-client';

// GET /api/portfolio - Get portfolio summary and positions
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    const response = await backendFetch('/portfolio', {
      // Cache for 30 seconds on the edge
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Portfolio API error:', response.status, errorData);
      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch portfolio data' } as ApiError,
        { status: response.status }
      );
    }

    const data: PortfolioResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Check if it's an auth error (Response object thrown by authGuard)
    if (error instanceof Response) {
      return error;
    }
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}

// POST /api/portfolio/sync - Trigger data sync
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await authGuard();

    const body = await request.json().catch(() => ({}));

    const response = await backendFetch('/portfolio/sync', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to trigger sync' } as ApiError,
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error('Portfolio sync error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
