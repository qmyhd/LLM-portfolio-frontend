'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * CursorTrail - Smooth glowing cursor follower.
 *
 * Inspired by codepen juliangarnier/pen/JojxjwB.
 * A single soft-glow circle that smoothly follows the cursor with easing.
 *
 * Features:
 * - Smooth lerp-based following with requestAnimationFrame
 * - Radial gradient glow with mix-blend-mode for background blending
 * - Subtle scale animation on mouse movement
 * - Hides on touch/mobile devices
 * - Respects `prefers-reduced-motion`
 */

export function CursorTrail() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const coords = useRef({ x: 0, y: 0 });
  const cursorPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const velocity = useRef({ x: 0, y: 0 });
  const lastCoords = useRef({ x: 0, y: 0 });

  const animateCursor = useCallback(() => {
    // Track velocity for scale effect
    velocity.current.x = coords.current.x - lastCoords.current.x;
    velocity.current.y = coords.current.y - lastCoords.current.y;
    lastCoords.current.x = coords.current.x;
    lastCoords.current.y = coords.current.y;

    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
    const scaleFactor = 1 + Math.min(speed * 0.003, 0.15);

    // Inner dot: fast follow
    cursorPos.current.x += (coords.current.x - cursorPos.current.x) * 0.25;
    cursorPos.current.y += (coords.current.y - cursorPos.current.y) * 0.25;

    // Outer ring: slower follow for trail feel
    ringPos.current.x += (coords.current.x - ringPos.current.x) * 0.12;
    ringPos.current.y += (coords.current.y - ringPos.current.y) * 0.12;

    if (cursorRef.current) {
      cursorRef.current.style.transform =
        `translate(${cursorPos.current.x}px, ${cursorPos.current.y}px) translate(-50%, -50%) scale(${scaleFactor})`;
    }

    if (ringRef.current) {
      ringRef.current.style.transform =
        `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%) scale(${1 + Math.min(speed * 0.005, 0.2)})`;
    }

    animFrameRef.current = requestAnimationFrame(animateCursor);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reducedMotion || isTouchDevice) {
      if (cursorRef.current) cursorRef.current.style.display = 'none';
      if (ringRef.current) ringRef.current.style.display = 'none';
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      coords.current.x = e.clientX;
      coords.current.y = e.clientY;
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    animFrameRef.current = requestAnimationFrame(animateCursor);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [animateCursor]);

  return (
    <>
      {/* Hide default cursor on desktop */}
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

      {/* Outer glow ring - slower follow */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '1.5px solid rgba(88, 101, 242, 0.3)',
          willChange: 'transform',
          zIndex: 9999,
          transition: 'width 0.2s, height 0.2s, border-color 0.2s',
        }}
      />

      {/* Inner dot - fast follow */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0"
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(88,101,242,0.9), rgba(147,51,234,0.7))',
          boxShadow: '0 0 20px rgba(88,101,242,0.4), 0 0 40px rgba(88,101,242,0.15)',
          mixBlendMode: 'screen',
          willChange: 'transform',
          zIndex: 10000,
        }}
      />
    </>
  );
}
