'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { StarfieldBackground } from '@/components/ui/StarfieldBackground';

/**
 * SigninIntro - Animated sign-in experience.
 *
 * Inspired by the anime.js v2.0 logo animation gist.
 * Sequence:
 *   1. Three-letter "QQQ" animation (stroke draw → fill → reveal)
 *   2. "LLM Portfolio" text fades in below
 *   3. Entire intro fades out → starfield + Google sign-in button
 *
 * - Uses anime.js v4 for animations
 * - Respects `prefers-reduced-motion`
 * - `signIn("google")` from NextAuth
 */

type Phase = 'intro' | 'signin';

function SigninIntroContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [phase, setPhase] = useState<Phase>('intro');
  const introRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const runIntroAnimation = useCallback(async () => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Skip animation for reduced motion
    if (reducedMotion) {
      setPhase('signin');
      return;
    }

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

      // Phase 1: Scale + fade in each Q letter sequentially
      const letters = document.querySelectorAll('.qqq-letter');

      // Start letters hidden
      letters.forEach((el) => {
        (el as HTMLElement).style.opacity = '0';
        (el as HTMLElement).style.transform = 'scale(0.3) translateY(20px)';
      });

      // Animate each letter in with stagger
      await animateAsync(letters, {
        opacity: [0, 1],
        scale: [0.3, 1],
        translateY: [20, 0],
        duration: 600,
        easing: 'easeOutBack',
        delay: stagger(250),
      });

      // Color pulse on all letters
      await animateAsync('.qqq-letter path', {
        stroke: ['#ffffff', '#5865f2'],
        fill: ['rgba(88,101,242,0)', 'rgba(88,101,242,0.15)'],
        duration: 500,
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
    runIntroAnimation();
  }, [runIntroAnimation]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Starfield always renders underneath */}
      <StarfieldBackground visible={true} />

      {/* Intro overlay */}
      {phase === 'intro' && (
        <div
          ref={introRef}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#0a0e1a' }}
        >
          {/* QQQ Letters */}
          <div className="flex items-center gap-[clamp(0.5rem,2vw,2rem)]">
            {['Q', 'Q', 'Q'].map((_, i) => (
              <svg
                key={i}
                className="qqq-letter"
                viewBox="0 0 120 140"
                width="clamp(60px, 12vw, 120px)"
                height="clamp(70px, 14vw, 140px)"
              >
                <path
                  d="M60 10 C30 10, 10 35, 10 70 C10 105, 30 130, 60 130 C90 130, 110 105, 110 70 C110 35, 90 10, 60 10 Z M75 100 L95 125"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ))}
          </div>

          {/* Subtitle */}
          <div
            ref={subtitleRef}
            className="mt-6 text-center"
            style={{ opacity: 0 }}
          >
            <h1 className="text-[clamp(1.5rem,4vw,3rem)] font-bold tracking-tight">
              <span className="text-white">LLM </span>
              <span className="text-[#5865f2]">Portfolio</span>
            </h1>
            <p className="mt-2 text-[clamp(0.75rem,1.5vw,1rem)] text-gray-400">
              Trading analytics & position tracking
            </p>
          </div>
        </div>
      )}

      {/* Sign-in phase */}
      {phase === 'signin' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center animate-fade-in">
          <div className="relative z-10 max-w-md w-full mx-4 space-y-8 p-8">
            {/* Logo/Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                📊 Portfolio Journal
              </h1>
              <p className="text-gray-400">
                Trading analytics and position tracking
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200 text-center">
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

            {/* Sign In Card */}
            <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl p-8 space-y-6 border border-gray-700/50">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white">
                  Sign in to continue
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Use your authorized Google account
                </p>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={() => signIn('google', { callbackUrl })}
                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
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
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800/60 text-gray-500">
                    Authorized access only
                  </span>
                </div>
              </div>

              <p className="text-center text-gray-500 text-xs">
                This dashboard is restricted to authorized users only.
                <br />
                Contact the administrator for access.
              </p>
            </div>

            <p className="text-center text-gray-600 text-xs">
              LLM Portfolio Journal &copy; {new Date().getFullYear()}
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
