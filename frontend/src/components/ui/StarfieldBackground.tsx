'use client';

import { useEffect, useRef } from 'react';

/**
 * StarfieldBackground - Canvas-based animated starfield.
 *
 * Inspired by the liquid gradient gist (Three.js), simplified to a
 * lightweight 2D canvas starfield with twinkling + slow drift.
 *
 * - Covers the full viewport as an absolute/fixed background
 * - Respects `prefers-reduced-motion` (static stars, no animation)
 * - Self-contained with no external dependencies
 */

interface StarfieldProps {
  /** Number of stars to render */
  starCount?: number;
  /** Background color (CSS color string) */
  bgColor?: string;
  /** Whether the component is visible */
  visible?: boolean;
  /** CSS className for the wrapper */
  className?: string;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
  color: string;
}

const STAR_COLORS = [
  '#ffffff',
  '#e0e7ff', // light indigo
  '#c7d2fe', // indigo-200
  '#a5b4fc', // indigo-300
  '#818cf8', // indigo-400
  '#5865f2', // brand primary
  '#3ba55d', // profit green (rare)
];

function createStars(count: number, w: number, h: number): Star[] {
  return Array.from({ length: count }, () => {
    const colorRand = Math.random();
    let color: string;
    if (colorRand < 0.6) color = STAR_COLORS[0]; // white
    else if (colorRand < 0.8) color = STAR_COLORS[1];
    else if (colorRand < 0.9) color = STAR_COLORS[2];
    else if (colorRand < 0.95) color = STAR_COLORS[3];
    else if (colorRand < 0.98) color = STAR_COLORS[5]; // brand primary
    else color = STAR_COLORS[6]; // green (rare accent)

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.8 + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinkleOffset: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.08,
      color,
    };
  });
}

export function StarfieldBackground({
  starCount = 180,
  bgColor = '#0a0e1a',
  visible = true,
  className = '',
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.scale(dpr, dpr);
      starsRef.current = createStars(starCount, window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Clear
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      timeRef.current += 1;

      for (const star of starsRef.current) {
        // Twinkle
        const twinkle = reducedMotion
          ? star.opacity
          : star.opacity +
            Math.sin(timeRef.current * star.twinkleSpeed + star.twinkleOffset) * 0.3;
        const alpha = Math.max(0.05, Math.min(1, twinkle));

        // Drift (slow movement)
        if (!reducedMotion) {
          star.x += star.driftX;
          star.y += star.driftY;

          // Wrap around
          if (star.x < -5) star.x = w + 5;
          if (star.x > w + 5) star.x = -5;
          if (star.y < -5) star.y = h + 5;
          if (star.y > h + 5) star.y = -5;
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Glow for larger stars
        if (star.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha * 0.1;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [visible, starCount, bgColor]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      aria-hidden="true"
      style={{ zIndex: 0 }}
    />
  );
}
