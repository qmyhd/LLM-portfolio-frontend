'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LiquidGradientBackground } from '@/components/ui/LiquidGradientBackground';
import { hasRole } from '@/lib/roles';

/**
 * Waiting-for-approval page. Shown to signed-in accounts the owner has not
 * approved yet. Calls no /api data route (they all answer 403 until approval).
 * "Check again" asks the server to re-read the role; when it ranks 1 or more
 * we reload fully so the middleware sees the new cookie.
 */

const MESSAGE_STILL_PENDING = 'Not approved yet. Try again later.';
const MESSAGE_FAILED = "Couldn't check right now. Try again in a moment.";

const buttonBase =
  'w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl font-semibold transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2] ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none';

export default function PendingPage() {
  const { data: session, update } = useSession();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('');

  const email = session?.user?.email;

  async function checkAgain() {
    if (checking) return;
    setChecking(true);
    setMessage('');
    try {
      const fresh = await update();
      if (!fresh) {
        setMessage(MESSAGE_FAILED);
      } else if (hasRole(fresh.user?.role, 'guest')) {
        // Full reload so the middleware sees the refreshed cookie.
        window.location.assign('/');
        return;
      } else {
        setMessage(MESSAGE_STILL_PENDING);
      }
    } catch {
      setMessage(MESSAGE_FAILED);
    }
    setChecking(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0e1a]">
      <LiquidGradientBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <p
              className="text-5xl font-black"
              aria-hidden="true"
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                background: 'linear-gradient(135deg, #5865f2, #9333ea)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 24px rgba(88,101,242,0.5))',
              }}
            >
              QQQ
            </p>
          </div>

          <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 border border-white/[0.08]">
            <h1 className="text-xl sm:text-2xl font-semibold text-white text-center">
              Waiting for approval
            </h1>

            <p className="text-foreground text-base leading-relaxed text-center">
              Thanks for signing in. This is a private site, and the owner approves each
              account by hand. You&apos;ll get in as soon as that&apos;s done.
            </p>

            {email && (
              <p className="text-foreground-muted text-sm text-center break-words">
                Signed in as {email}
              </p>
            )}

            <p
              role="status"
              aria-live="polite"
              className="min-h-[1.25rem] text-sm text-center text-foreground-muted"
            >
              {checking ? 'Checking…' : message}
            </p>

            <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
              <button
                type="button"
                onClick={checkAgain}
                disabled={checking}
                className={`${buttonBase} text-white shadow-lg`}
                style={{ background: 'linear-gradient(135deg, #5865f2, #9333ea)' }}
              >
                {checking ? 'Checking…' : 'Check again'}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={`${buttonBase} bg-white/10 hover:bg-white/15 ring-1 ring-white/20 text-white font-medium`}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
