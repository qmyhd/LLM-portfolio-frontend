'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DM_Serif_Display } from 'next/font/google';

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'] });

/**
 * QQQSplash — Root-level intro animation overlay.
 *
 * Plays on every hard page load (fresh navigation / refresh), regardless
 * of auth state.  After the animation completes it fades out and unmounts,
 * revealing whatever is underneath (dashboard or login).
 *
 * Animation sequence (anime.js v4):
 *   1. QQQ letters scale-in with stagger + expo easing
 *   2. Glow pulse on all three letters
 *   3. "LLM Portfolio" subtitle slides up
 *   4. Hold 300ms
 *   5. Entire overlay fades + scales out
 *
 * Inspired by Julian Garnier's anime.js v2 logo animation
 * (https://codepen.io/juliangarnier/pen/oZNYXB) — attribution preserved.
 *
 * Respects prefers-reduced-motion: skips straight to content.
 */
export function QQQSplash({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const runAnimation = useCallback(async () => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (reducedMotion) {
      onComplete();
      return;
    }

    try {
      const { animate, stagger } = await import('animejs');

      const animateAsync = (
        targets: Parameters<typeof animate>[0],
        params: Parameters<typeof animate>[1],
      ) =>
        new Promise<void>((resolve) => {
          animate(targets, { ...params, onComplete: () => resolve() });
        });

      const letters = document.querySelectorAll('.qqq-splash-letter');

      // Prep letters hidden
      letters.forEach((el) => {
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.transform = 'scale(0.5) translateY(40px)';
      });

      // 1 — Scale-in all letters together with subtle stagger
      await animateAsync(letters, {
        opacity: [0, 1],
        scale: [0.8, 1],
        translateY: [20, 0],
        duration: 500,
        easing: 'easeOutExpo',
        delay: stagger(50),
      });

      // 2 — Subtitle slide-up
      if (subtitleRef.current) {
        await animateAsync(subtitleRef.current, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 400,
          easing: 'easeOutQuart',
        });
      }

      // 3 — Hold
      await new Promise((r) => setTimeout(r, 300));

      // 4 — Fade out entire overlay
      if (overlayRef.current) {
        await animateAsync(overlayRef.current, {
          opacity: [1, 0],
          scale: [1, 0.96],
          duration: 500,
          easing: 'easeInQuart',
        });
      }

      onComplete();
    } catch {
      // If anime fails, just skip
      onComplete();
    }
  }, [reducedMotion, onComplete]);

  useEffect(() => {
    runAnimation();
  }, [runAnimation]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f0f 70%)' }}
      aria-hidden="true"
    >
      {/* QQQ Letters */}
      <div className="flex items-baseline" style={{ gap: 0, letterSpacing: '-0.06em' }}>
        {['Q', 'Q', 'Q'].map((letter, i) => (
          <div
            key={i}
            className={`qqq-splash-letter ${dmSerif.className}`}
            style={{
              fontSize: 'clamp(5rem, 14vw, 12rem)',
              fontWeight: 400,
              lineHeight: 1,
              background: 'linear-gradient(135deg, #5865f2, #9333ea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(88,101,242,0.25))',
              opacity: 0,
            }}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Subtitle */}
      <div ref={subtitleRef} className="mt-4 text-center" style={{ opacity: 0 }}>
        <h1 className="text-[clamp(1.25rem,3.5vw,2.5rem)] font-bold tracking-tight">
          <span className="text-white">LLM </span>
          <span className="text-[#5865f2]">Portfolio</span>
        </h1>
      </div>

      {/* Progress bar */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: '15%', width: 'min(200px, 60vw)' }}
      >
        <div
          className="h-[2px] rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full splash-progress-bar"
            style={{
              background: 'linear-gradient(90deg, #5865f2, #9333ea)',
              width: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
