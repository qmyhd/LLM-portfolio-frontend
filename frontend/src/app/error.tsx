'use client';

import { useEffect } from 'react';

/**
 * Root error boundary. Without this, an unhandled render error (e.g. a null
 * field slipping through) shows a blank page / Next default. This renders a
 * graceful fallback with a retry, and logs the error for debugging.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App render error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-foreground-muted max-w-md text-sm">
        {error.message || 'An unexpected error occurred while rendering this page.'}
      </p>
      <button onClick={reset} className="btn-primary">
        Try again
      </button>
    </div>
  );
}
