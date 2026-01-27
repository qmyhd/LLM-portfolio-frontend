import { NextRequest, NextResponse } from 'next/server';
import type { IdeasResponse, ApiError } from '@/types/api';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

// GET /api/stocks/[ticker]/ideas - Get parsed trading ideas
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ticker } = await params;
    const normalizedTicker = ticker.toUpperCase();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';
    const direction = searchParams.get('direction') || '';

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit);
    if (direction) queryParams.set('direction', direction);

    const response = await fetch(
      `${API_URL}/stocks/${normalizedTicker}/ideas?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 60 seconds
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Ideas for ${normalizedTicker} API error:`, response.status, errorData);

      return NextResponse.json(
        { error: errorData.detail || 'Failed to fetch ideas' } as ApiError,
        { status: response.status }
      );
    }

    const data: IdeasResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ideas fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend API' } as ApiError,
      { status: 502 }
    );
  }
}
