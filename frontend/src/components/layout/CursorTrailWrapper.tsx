'use client';

import { usePathname } from 'next/navigation';
import { CursorTrail } from '@/components/ui/CursorTrail';

/**
 * Client wrapper that conditionally renders CursorTrail
 * based on the current route (excluded from /login).
 */
export function CursorTrailWrapper() {
  const pathname = usePathname();

  // Don't show cursor trail on the login page
  if (pathname === '/login') return null;

  return <CursorTrail />;
}
