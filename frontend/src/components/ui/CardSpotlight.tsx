'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface CardSpotlightProps {
  children: ReactNode;
  className?: string;
}

export function CardSpotlight({ children, className }: CardSpotlightProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const setCenterPosition = useCallback(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }
    const { width, height } = node.getBoundingClientRect();
    node.style.setProperty('--spotlight-x', `${width / 2}px`);
    node.style.setProperty('--spotlight-y', `${height / 2}px`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    setCenterPosition();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [setCenterPosition]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion) {
        return;
      }
      const node = containerRef.current;
      if (!node) {
        return;
      }
      const rect = node.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      node.style.setProperty('--spotlight-x', `${x}px`);
      node.style.setProperty('--spotlight-y', `${y}px`);
    },
    [prefersReducedMotion]
  );

  return (
    <div
      ref={containerRef}
      className={clsx('card-spotlight', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={setCenterPosition}
    >
      {children}
    </div>
  );
}
