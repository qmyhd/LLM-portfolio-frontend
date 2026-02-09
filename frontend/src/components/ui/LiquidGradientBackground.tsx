'use client';

import { useEffect, useRef } from 'react';

/**
 * LiquidGradientBackground
 *
 * Animated liquid gradient background inspired by the Three.js shader approach
 * from codepen cameronknight/pen/ogxWmBP, implemented with CSS for performance.
 *
 * Uses multiple overlapping radial gradients with animated transforms and
 * heavy blur to create an organic, flowing gradient effect.
 *
 * Respects prefers-reduced-motion.
 */

export function LiquidGradientBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion && containerRef.current) {
      const layers = containerRef.current.querySelectorAll<HTMLElement>('[data-gradient-layer]');
      layers.forEach((el) => {
        el.style.animationPlayState = 'paused';
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#0a0e1a' }}
    >
      {/* Base gradient layer */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 40%, #0f172a 100%)',
        }}
      />

      {/* Animated blob 1 - Primary blue/indigo */}
      <div
        data-gradient-layer
        className="absolute"
        style={{
          width: '130%',
          height: '130%',
          top: '-15%',
          left: '-15%',
          background: 'radial-gradient(ellipse at 30% 40%, rgba(88, 101, 242, 0.35) 0%, rgba(88, 101, 242, 0.1) 30%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'liquid-drift-1 18s ease-in-out infinite',
        }}
      />

      {/* Animated blob 2 - Purple/violet */}
      <div
        data-gradient-layer
        className="absolute"
        style={{
          width: '120%',
          height: '120%',
          top: '-10%',
          left: '-10%',
          background: 'radial-gradient(ellipse at 70% 60%, rgba(147, 51, 234, 0.3) 0%, rgba(124, 58, 237, 0.1) 35%, transparent 60%)',
          filter: 'blur(100px)',
          animation: 'liquid-drift-2 22s ease-in-out infinite',
        }}
      />

      {/* Animated blob 3 - Teal/green accent */}
      <div
        data-gradient-layer
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          top: '0',
          left: '0',
          background: 'radial-gradient(ellipse at 50% 80%, rgba(59, 165, 93, 0.15) 0%, transparent 50%)',
          filter: 'blur(90px)',
          animation: 'liquid-drift-3 25s ease-in-out infinite',
        }}
      />

      {/* Animated blob 4 - Deep indigo accent */}
      <div
        data-gradient-layer
        className="absolute"
        style={{
          width: '110%',
          height: '110%',
          top: '-5%',
          left: '-5%',
          background: 'radial-gradient(ellipse at 20% 70%, rgba(67, 56, 202, 0.25) 0%, transparent 45%)',
          filter: 'blur(70px)',
          animation: 'liquid-drift-4 20s ease-in-out infinite',
        }}
      />

      {/* Subtle noise overlay for texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      <style jsx>{`
        @keyframes liquid-drift-1 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(8%, -6%) scale(1.05) rotate(2deg);
          }
          50% {
            transform: translate(-4%, 8%) scale(0.98) rotate(-1deg);
          }
          75% {
            transform: translate(5%, 3%) scale(1.02) rotate(1deg);
          }
        }

        @keyframes liquid-drift-2 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-10%, 5%) scale(1.08) rotate(-2deg);
          }
          50% {
            transform: translate(6%, -8%) scale(0.95) rotate(1.5deg);
          }
          75% {
            transform: translate(-3%, -4%) scale(1.03) rotate(-0.5deg);
          }
        }

        @keyframes liquid-drift-3 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
          }
          33% {
            transform: translate(12%, -5%) scale(1.1);
          }
          66% {
            transform: translate(-8%, 6%) scale(0.92);
          }
        }

        @keyframes liquid-drift-4 {
          0%, 100% {
            transform: translate(0%, 0%) scale(1) rotate(0deg);
          }
          30% {
            transform: translate(-7%, -8%) scale(1.06) rotate(3deg);
          }
          60% {
            transform: translate(9%, 4%) scale(0.97) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  );
}
