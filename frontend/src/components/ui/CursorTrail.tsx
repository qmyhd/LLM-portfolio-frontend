'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * CustomCursor - Clean, professional cursor replacement.
 *
 * A minimal dot + ring that smoothly follows the pointer with lerp easing.
 * The ring expands subtly on interactive elements (links, buttons).
 *
 * - Hides on touch/mobile devices
 * - Respects `prefers-reduced-motion`
 * - 60 fps via requestAnimationFrame
 */

const DOT_SIZE = 6;
const RING_SIZE = 32;
const DOT_EASE = 0.3;
const RING_EASE = 0.15;

export function CursorTrail() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const hovering = useRef(false);

  const animate = useCallback(() => {
    dotPos.current.x += (mouse.current.x - dotPos.current.x) * DOT_EASE;
    dotPos.current.y += (mouse.current.y - dotPos.current.y) * DOT_EASE;

    ringPos.current.x += (mouse.current.x - ringPos.current.x) * RING_EASE;
    ringPos.current.y += (mouse.current.y - ringPos.current.y) * RING_EASE;

    const ringScale = hovering.current ? 1.4 : 1;
    const dotScale = hovering.current ? 0.6 : 1;

    if (dotRef.current) {
      dotRef.current.style.transform =
        `translate(${dotPos.current.x}px, ${dotPos.current.y}px) translate(-50%, -50%) scale(${dotScale})`;
    }

    if (ringRef.current) {
      ringRef.current.style.transform =
        `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%) scale(${ringScale})`;
      ringRef.current.style.opacity = hovering.current ? '1' : '0.5';
    }

    raf.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (reducedMotion || isTouchDevice) {
      if (dotRef.current) dotRef.current.style.display = 'none';
      if (ringRef.current) ringRef.current.style.display = 'none';
      return;
    }

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      hovering.current = !!target.closest('a, button, [role="button"], input, select, textarea, label, [data-cursor-hover]');
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf.current);
    };
  }, [animate]);

  return (
    <>
      {/* Hide native cursor on pointer devices */}
      <style jsx global>{`
        @media (hover: hover) and (pointer: fine) {
          * { cursor: none !important; }
        }
      `}</style>

      {/* Ring — subtle border circle */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0"
        style={{
          width: `${RING_SIZE}px`,
          height: `${RING_SIZE}px`,
          borderRadius: '50%',
          border: '1.5px solid rgba(255, 255, 255, 0.35)',
          opacity: 0.5,
          willChange: 'transform, opacity',
          zIndex: 9999,
          transition: 'opacity 0.2s ease, border-color 0.2s ease',
        }}
      />

      {/* Dot — solid center point */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0"
        style={{
          width: `${DOT_SIZE}px`,
          height: `${DOT_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          willChange: 'transform',
          zIndex: 10000,
          transition: 'background-color 0.2s ease',
        }}
      />
    </>
  );
}
