import { NextRequest, NextResponse } from 'next/server';
import type { PortfolioResponse, ApiError } from '@/types/api';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// GET /api/portfolio - Get portfolio summary and positions
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_URL}/portfolio`, {
      headers: {
        'Content-Type': 'application/json',
      },
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
    const body = await request.json().catch(() => ({}));

    const response = await fetch(`${API_URL}/portfolio/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    console.error('Portfolio sync error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
