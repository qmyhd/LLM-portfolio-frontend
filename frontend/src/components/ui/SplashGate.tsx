'use client';

import { useState, useEffect } from 'react';
import { QQQSplash } from '@/components/ui/QQQSplash';

const SESSION_KEY = 'qqq-splash-shown';

/**
 * SplashGate — Renders the QQQ splash overlay once per browser session, then
 * unmounts it and reveals the children (app shell).
 *
 * A data dashboard is opened many times a day; playing the intro on every hard
 * load is tiresome and reads as unpolished. We show it once per session (first
 * load / first tab), then skip it on subsequent refreshes and navigations
 * within that session.
 *
 * SSR-safe: the first client render always starts with the splash hidden
 * (matching the server-rendered markup), then an effect decides whether to
 * play it, so there is no hydration mismatch and no flash of the splash for
 * returning visitors.
 */
export function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* private mode / storage blocked — just skip the splash */
    }
    if (!alreadyShown) {
      setShowSplash(true);
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
    }
    setReady(true);
  }, []);

  return (
    <>
      {ready && showSplash && <QQQSplash onComplete={() => setShowSplash(false)} />}
      {/* Always render children so auth/middleware can run; splash overlays on top */}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>{children}</div>
    </>
  );
}
