'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { usePortfolio } from '@/hooks';

export function ConnectionBanner() {
  const { data } = usePortfolio();
  const status = data?.summary?.connectionStatus;

  if (!status || status === 'connected') return null;

  const isError = status === 'error';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
        isError
          ? 'bg-loss/10 text-loss border border-loss/20'
          : 'bg-status-warning/10 text-status-warning border border-status-warning/20'
      }`}
    >
      {isError ? (
        <XCircleIcon className="h-4 w-4 flex-shrink-0" />
      ) : (
        <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
      )}
      <span className="flex-1">
        Brokerage connection {status === 'disconnected' ? 'lost' : status}.
        Data may be stale.
      </span>
      <Link
        href="/settings"
        className="font-medium underline underline-offset-2 hover:opacity-80 flex-shrink-0"
      >
        Reconnect
      </Link>
    </div>
  );
}
