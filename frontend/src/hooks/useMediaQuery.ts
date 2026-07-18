'use client';

import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query.
 *
 * Returns `null` during SSR and the first client render (before the media
 * query has been evaluated), so callers can render a neutral skeleton
 * instead of guessing a breakpoint — this avoids hydration mismatches AND
 * avoids mounting the wrong layout's data-fetching components.
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * if (isDesktop === null) return <Skeleton />;
 * return isDesktop ? <DesktopLayout /> : <MobileLayout />;
 */
export function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
