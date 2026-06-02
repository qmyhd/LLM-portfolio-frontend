'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { BucketProvider } from '@/contexts/BucketContext';
import { BUCKET_LABELS, type BucketName } from '@/lib/bucket';
import { ProfilePanel } from '@/components/stock/ProfilePanel';
import type { ProfileQueueItem } from '@/types/api';

const REASON_LABEL: Record<string, string> = {
  no_profile: 'No profile', stale: 'Stale', changed: 'Changed', ok: 'Up to date',
};
const REASON_COLOR: Record<string, string> = {
  no_profile: 'text-primary', stale: 'text-status-warning',
  changed: 'text-status-warning', ok: 'text-foreground-muted',
};

export default function ProfilesWorkspacePage() {
  const [queue, setQueue] = useState<ProfileQueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profiles?queue=1', { cache: 'no-store' });
      if (res.ok) setQueue((await res.json()).queue ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const current = queue[index] ?? null;
  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, queue.length)), [queue.length]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Profiles</h1>
                <p className="text-foreground-muted">
                  {loading
                    ? 'Loading…'
                    : `${queue.length} holdings to review · ${Math.min(index + 1, queue.length)}/${queue.length}`}
                </p>
              </div>
              <button onClick={loadQueue} className="text-sm text-primary hover:underline">
                Refresh queue
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Queue list */}
              <div className="card p-2 max-h-[70vh] overflow-y-auto">
                {queue.length === 0 && !loading && (
                  <p className="text-sm text-foreground-muted p-3">No holdings to review.</p>
                )}
                {queue.map((it, i) => (
                  <button
                    key={`${it.symbol}-${it.bucket}`}
                    onClick={() => setIndex(i)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-md flex items-center justify-between',
                      i === index ? 'bg-primary/10' : 'hover:bg-background-hover',
                    )}
                  >
                    <span className="font-mono text-sm">
                      {it.symbol}
                      <span className="text-foreground-muted text-xs ml-1">
                        {BUCKET_LABELS[it.bucket as BucketName] ?? it.bucket}
                      </span>
                    </span>
                    <span className={clsx('text-[10px]', REASON_COLOR[it.reason])}>
                      {REASON_LABEL[it.reason] ?? it.reason}
                    </span>
                  </button>
                ))}
              </div>

              {/* Editor */}
              <div className="md:col-span-2 card overflow-hidden">
                {current ? (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                      <Link
                        href={`/stock/${current.symbol}?bucket=${current.bucket}`}
                        className="font-mono font-semibold hover:text-primary"
                      >
                        {current.symbol} · {BUCKET_LABELS[current.bucket as BucketName] ?? current.bucket}
                      </Link>
                      <button onClick={goNext} className="text-xs text-foreground-muted hover:text-foreground">
                        Skip →
                      </button>
                    </div>
                    <BucketProvider bucket={current.bucket as BucketName}>
                      <ProfilePanel
                        ticker={current.symbol}
                        onSaved={() => {
                          loadQueue();
                          goNext();
                        }}
                      />
                    </BucketProvider>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <CheckCircleIcon className="h-10 w-10 text-profit mb-2" />
                    <p className="text-foreground-muted">All caught up — no more holdings to review.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
