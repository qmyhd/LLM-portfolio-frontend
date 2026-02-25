'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { LiquidGradientBackground } from '@/components/ui/LiquidGradientBackground';

/**
 * SigninIntro — Login page with animated liquid gradient background
 * and glassmorphism sign-in card.
 *
 * The QQQ intro splash animation was moved to <QQQSplash /> (root layout)
 * so it plays on every hard load. This component now renders only the
 * sign-in form over the liquid gradient.
 */

function SigninIntroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Liquid gradient background (Three.js shader) */}
      <LiquidGradientBackground />

      {/* Sign-in form */}
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
            <p className="text-gray-400 text-lg">LLM Portfolio</p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="bg-red-900/30 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 text-red-200 text-center">
              {error === 'AccessDenied' ? (
                <>
                  <p className="font-semibold">Access Denied</p>
                  <p className="text-sm mt-1">
                    Your account is not authorized to access this dashboard.
                  </p>
                </>
              ) : error === 'CredentialsSignin' ? (
                <p>Invalid username or password.</p>
              ) : (
                <p>An error occurred during sign in. Please try again.</p>
              )}
            </div>
          )}

          {/* Sign In Card — Glassmorphism */}
          <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl shadow-2xl p-8 space-y-5 border border-white/[0.08]">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">
                Sign in to continue
              </h2>
            </div>

            {/* Credentials Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!username.trim() || !password.trim() || isSubmitting) return;
                setLoginError('');
                setIsSubmitting(true);
                try {
                  const result = await signIn('credentials', {
                    username: username.trim(),
                    password: password.trim(),
                    redirect: false,
                  });
                  if (result?.error) {
                    setLoginError('Invalid username or password');
                  } else if (result?.ok) {
                    router.push(callbackUrl);
                  }
                } catch {
                  setLoginError('Something went wrong. Please try again.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              {/* Username */}
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLoginError('');
                  }}
                  autoComplete="username"
                  autoFocus
                  aria-label="Username"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2]/50 focus:border-[#5865f2]/50 transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError('');
                  }}
                  autoComplete="current-password"
                  aria-label="Password"
                  className="w-full pl-11 pr-4 py-3 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#5865f2]/50 focus:border-[#5865f2]/50 transition-all"
                />
              </div>

              {/* Inline error */}
              {loginError && (
                <p className="text-red-400 text-sm text-center">{loginError}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password.trim()}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #5865f2, #9333ea)',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-gray-500 bg-[#0a0e1a]">
                  or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={() => signIn('google', { callbackUrl })}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white font-medium rounded-xl transition-all duration-200 hover:scale-[1.02]"
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
          </div>

          <p className="text-center text-gray-600 text-xs">
            LLM Portfolio &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
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
