'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LiquidGradientBackground } from '@/components/ui/LiquidGradientBackground';

/**
 * SigninIntro - Animated sign-in experience.
 *
 * Sequence:
 *   1. Three large "QQQ" text characters animate in with gradient fill
 *   2. "LLM Portfolio" subtitle fades in below
 *   3. Entire intro fades out → liquid gradient + Google sign-in
 *
 * - Uses anime.js v4 for animations
 * - Liquid gradient background (replaces starfield)
 * - Glassmorphism sign-in card
 * - Respects `prefers-reduced-motion`
 * - `signIn("google")` from NextAuth
 */

type Phase = 'intro' | 'signin';

function SigninIntroContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [phase, setPhase] = useState<Phase>('intro');
  const [fontLoaded, setFontLoaded] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load display font for QQQ letters
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    link.onload = () => setFontLoaded(true);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const runIntroAnimation = useCallback(async () => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Skip animation for reduced motion
    if (reducedMotion) {
      setPhase('signin');
      return;
    }

    // Wait a tick for font to be ready
    await new Promise((r) => setTimeout(r, 300));

    try {
      const { animate, stagger } = await import('animejs');

      // Helper: wrap anime.js v4 animate in a promise via onComplete
      const animateAsync = (
        targets: Parameters<typeof animate>[0],
        params: Parameters<typeof animate>[1]
      ) =>
        new Promise<void>((resolve) => {
          animate(targets, { ...params, onComplete: () => resolve() });
        });

      // Phase 1: Scale + fade in each Q letter with spring physics
      const letters = document.querySelectorAll('.qqq-letter');

      // Start letters hidden
      letters.forEach((el) => {
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.transform = 'scale(0.5) translateY(40px)';
      });

      // Animate each letter in with stagger
      await animateAsync(letters, {
        opacity: [0, 1],
        scale: [0.5, 1],
        translateY: [40, 0],
        duration: 900,
        easing: 'easeOutBack',
        delay: stagger(200),
      });

      // Glow pulse effect
      await animateAsync(letters, {
        filter: [
          'drop-shadow(0 0 20px rgba(88,101,242,0.2))',
          'drop-shadow(0 0 60px rgba(88,101,242,0.5))',
          'drop-shadow(0 0 30px rgba(88,101,242,0.3))',
        ],
        duration: 800,
        easing: 'easeInOutQuad',
      });

      // Phase 2: Subtitle "LLM Portfolio" slides up
      if (subtitleRef.current) {
        await animateAsync(subtitleRef.current, {
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 600,
          easing: 'easeOutQuart',
        });
      }

      // Hold for a moment
      await new Promise((r) => setTimeout(r, 1200));

      // Phase 3: Fade out entire intro
      if (introRef.current) {
        await animateAsync(introRef.current, {
          opacity: [1, 0],
          scale: [1, 0.96],
          duration: 700,
          easing: 'easeInQuart',
        });
      }

      setPhase('signin');
    } catch {
      // Fallback: skip to signin
      setPhase('signin');
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (fontLoaded) {
      runIntroAnimation();
    }
  }, [fontLoaded, runIntroAnimation]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Liquid gradient background */}
      <LiquidGradientBackground />

      {/* Intro overlay */}
      {phase === 'intro' && (
        <div
          ref={introRef}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#0a0e1a' }}
        >
          {/* QQQ Letters - Large text with gradient fill */}
          <div className="flex items-center gap-[clamp(0.25rem,1.5vw,1.5rem)]">
            {['Q', 'Q', 'Q'].map((letter, i) => (
              <div
                key={i}
                className="qqq-letter"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(5rem, 14vw, 12rem)',
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(135deg, #5865f2, #9333ea, #5865f2)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 30px rgba(88,101,242,0.3))',
                }}
              >
                {letter}
              </div>
            ))}
          </div>

          {/* Subtitle */}
          <div
            ref={subtitleRef}
            className="mt-4 text-center"
            style={{ opacity: 0 }}
          >
            <h1 className="text-[clamp(1.25rem,3.5vw,2.5rem)] font-bold tracking-tight">
              <span className="text-white">LLM </span>
              <span className="text-[#5865f2]">Portfolio</span>
            </h1>
          </div>
        </div>
      )}

      {/* Sign-in phase */}
      {phase === 'signin' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center animate-fade-in">
          <div className="relative z-10 max-w-md w-full mx-4 space-y-6">
            {/* Logo/Title */}
            <div className="text-center">
              <h1
                className="text-6xl font-black mb-3"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  background: 'linear-gradient(135deg, #5865f2, #9333ea)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 20px rgba(88,101,242,0.3))',
                }}
              >
                QQQ
              </h1>
              <p className="text-gray-400 text-lg">
                LLM Portfolio
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 text-red-200 text-center">
                {error === 'AccessDenied' ? (
                  <>
                    <p className="font-semibold">Access Denied</p>
                    <p className="text-sm mt-1">
                      Your email is not authorized to access this dashboard.
                    </p>
                  </>
                ) : (
                  <p>An error occurred during sign in. Please try again.</p>
                )}
              </div>
            )}

            {/* Sign In Card - Glassmorphism */}
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-6 border border-white/[0.08]">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">
                  Sign in to continue
                </h2>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={() => signIn('google', { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 text-gray-500 bg-transparent">
                    Authorized access only
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-gray-600 text-xs">
              LLM Portfolio &copy; 2026
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SigninIntro() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <SigninIntroContent />
    </Suspense>
  );
}
