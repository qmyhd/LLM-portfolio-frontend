'use client';

import { usePathname } from 'next/navigation';
import { useRef, useEffect, useCallback } from 'react';

/**
 * Wraps page content and triggers a subtle fade/slide-up
 * animation on every route change using Anime.js v4.
 *
 * - Detects route changes via `usePathname()`.
 * - Respects `prefers-reduced-motion` — disables animation.
 * - Falls back to instant display if Anime.js fails to load.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPathRef = useRef(pathname);
  const isFirstRender = useRef(true);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const runTransition = useCallback(async () => {
    const el = containerRef.current;
    if (!el || reducedMotion) {
      if (el) el.style.opacity = '1';
      return;
    }

    try {
      const { animate } = await import('animejs');
      animate(el, {
        opacity: [0, 1],
        translateY: [8, 0],
        duration: 350,
        easing: 'easeOutCubic',
      });
    } catch {
      // Graceful fallback — just show content
      if (el) el.style.opacity = '1';
    }
  }, [reducedMotion]);

  useEffect(() => {
    // Skip animation on very first mount (SSR hydration)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (containerRef.current) containerRef.current.style.opacity = '1';
      return;
    }

    // Animate only when the path actually changes
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      runTransition();
    }
  }, [pathname, runTransition]);

  return (
    <div ref={containerRef} style={{ opacity: 1 }}>
      {children}
    </div>
  );
}
