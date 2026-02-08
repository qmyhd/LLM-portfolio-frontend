'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * CursorTrail - Animated trailing dots that follow the cursor.
 *
 * Inspired by the "Additive Creature" gist (anime.js v4 grid follow).
 * Simplified to a lightweight trail of fading circles using CSS transitions.
 *
 * - Hides on touch/mobile devices (no mousemove support)
 * - Respects `prefers-reduced-motion`
 * - Fully self-contained (no anime.js dependency for perf)
 */

const TRAIL_LENGTH = 12;
const COLORS = [
  '#5865f2', // primary
  '#4752c4', // primary-hover
  '#3ba55d', // profit green
  '#5865f2',
  '#4752c4',
  '#3ba55d',
  '#5865f2',
  '#4752c4',
  '#3ba55d',
  '#5865f2',
  '#4752c4',
  '#3ba55d',
];

export function CursorTrail() {
  const trailRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const coords = useRef({ x: 0, y: 0 });
  const isTouch = useRef(false);
  const animFrameRef = useRef<number>(0);

  const positions = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: 0, y: 0 }))
  );

  // Animation loop: each dot follows the one ahead with easing
  const animateTrail = useCallback(() => {
    // Lead dot follows cursor directly
    positions.current[0].x += (coords.current.x - positions.current[0].x) * 0.3;
    positions.current[0].y += (coords.current.y - positions.current[0].y) * 0.3;

    // Each subsequent dot follows the one ahead
    for (let i = 1; i < TRAIL_LENGTH; i++) {
      const prev = positions.current[i - 1];
      const curr = positions.current[i];
      curr.x += (prev.x - curr.x) * (0.25 - i * 0.012);
      curr.y += (prev.y - curr.y) * (0.25 - i * 0.012);
    }

    // Apply positions to DOM
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const el = trailRef.current[i];
      if (el) {
        el.style.transform = `translate(${positions.current[i].x}px, ${positions.current[i].y}px) translate(-50%, -50%)`;
      }
    }

    animFrameRef.current = requestAnimationFrame(animateTrail);
  }, []);

  useEffect(() => {
    // Skip on touch devices or reduced motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reducedMotion || isTouchDevice) {
      isTouch.current = true;
      if (containerRef.current) containerRef.current.style.display = 'none';
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      coords.current.x = e.clientX;
      coords.current.y = e.clientY;
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    animFrameRef.current = requestAnimationFrame(animateTrail);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [animateTrail]);

  return (
    <>
      {/* Hide default cursor on non-interactive elements */}
      <style jsx global>{`
        @media (hover: hover) and (pointer: fine) {
          body {
            cursor: none;
          }
          a, button, [role="button"], input, select, textarea, label {
            cursor: none;
          }
        }
      `}</style>

      <div
        ref={containerRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 9999 }}
      >
        {Array.from({ length: TRAIL_LENGTH }, (_, i) => {
          // Size decreases along the trail
          const size = Math.max(8 - i * 0.5, 2);
          // Opacity decreases along the trail
          const opacity = 1 - (i / TRAIL_LENGTH) * 0.85;

          return (
            <div
              key={i}
              ref={(el) => {
                if (el) trailRef.current[i] = el;
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                backgroundColor: COLORS[i],
                opacity,
                mixBlendMode: 'plus-lighter',
                willChange: 'transform',
                boxShadow: `0 0 ${size * 1.5}px ${COLORS[i]}`,
                transition: 'none',
              }}
            />
          );
        })}
      </div>
    </>
  );
}
