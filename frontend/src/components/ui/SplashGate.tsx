'use client';

import { useState } from 'react';
import { QQQSplash } from '@/components/ui/QQQSplash';

/**
 * SplashGate — Renders the QQQ splash overlay on every hard page load,
 * then unmounts it and reveals the children (app shell).
 *
 * Mount this at the root layout so it wraps everything, including
 * the login page and the authenticated dashboard.
 */
export function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <QQQSplash onComplete={() => setShowSplash(false)} />}
      {/* Always render children so auth/middleware can run; splash overlays on top */}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </>
  );
}
