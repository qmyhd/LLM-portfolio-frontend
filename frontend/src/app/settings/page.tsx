'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import {
  Cog6ToothIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import useSWR from 'swr';
import type { ConnectionsResponse } from '@/types/api';
import { BUCKET_NAMES, BUCKET_LABELS, type BucketName } from '@/lib/bucket';
import { usePrivacy } from '@/hooks/usePrivacy';
import { ReadOnlyNotice } from '@/components/ui/ReadOnlyNotice';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_CONFIG = {
  connected: {
    color: 'bg-gain/10 text-gain',
    icon: CheckCircleIcon,
    label: 'Connected',
  },
  disconnected: {
    color: 'bg-status-warning/10 text-status-warning',
    icon: ExclamationTriangleIcon,
    label: 'Disconnected',
  },
  error: {
    color: 'bg-loss/10 text-loss',
    icon: XCircleIcon,
    label: 'Error',
  },
  deleted: {
    color: 'bg-foreground-muted/10 text-foreground-muted',
    icon: XCircleIcon,
    label: 'Deleted',
  },
} as const;

export default function SettingsPage() {
  const { isOwner } = usePrivacy();
  const { data, error, isLoading, mutate } = useSWR<ConnectionsResponse>(
    '/api/connections',
    fetcher,
  );

  // Track per-account bucket-update state so we can show a spinner / error
  // inline next to the dropdown.
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [updateError, setUpdateError] = useState<Record<string, string>>({});

  const handleReconnect = async () => {
    try {
      const res = await fetch('/api/connections/portal', { method: 'POST' });
      const json = await res.json();
      if (json.redirectUri) {
        window.open(json.redirectUri, '_blank');
      }
    } catch (e) {
      console.error('Failed to open connection portal:', e);
    }
  };

  const handleBucketChange = async (accountId: string, bucket: BucketName) => {
    setUpdating((s) => ({ ...s, [accountId]: true }));
    setUpdateError((s) => ({ ...s, [accountId]: '' }));

    // Optimistic update — patch the local SWR cache so the dropdown reflects
    // the chosen value immediately. Roll back on error.
    const prev = data;
    if (prev) {
      const next: ConnectionsResponse = {
        connections: prev.connections.map((c) =>
          c.accountId === accountId ? { ...c, bucket } : c,
        ),
      };
      mutate(next, { revalidate: false });
    }

    try {
      const res = await fetch('/api/connections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, bucket }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Update failed (${res.status})`);
      }
      // Revalidate from server so we pick up any normalization.
      mutate();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update bucket';
      setUpdateError((s) => ({ ...s, [accountId]: msg }));
      // Roll back optimistic update.
      if (prev) mutate(prev, { revalidate: false });
    } finally {
      setUpdating((s) => ({ ...s, [accountId]: false }));
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Cog6ToothIcon className="h-8 w-8 text-foreground-muted" />
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>

            {/* Brokerage Connections */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Brokerage Connections
              </h2>

              {isLoading && (
                <p className="text-foreground-muted text-sm">
                  Loading connections...
                </p>
              )}

              {error && (
                <p className="text-loss text-sm">Failed to load connections.</p>
              )}

              {data?.connections?.map((conn) => {
                const config =
                  STATUS_CONFIG[conn.connectionStatus] ??
                  STATUS_CONFIG.connected;
                const StatusIcon = config.icon;
                const isUpdating = !!updating[conn.accountId];
                const rowError = updateError[conn.accountId];

                return (
                  <div
                    key={conn.accountId}
                    className="card flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 mb-2 gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {conn.institutionName || 'Unknown Brokerage'}
                      </p>
                      <p className="text-sm text-foreground-muted truncate">
                        {conn.name || conn.accountId}
                      </p>
                      {conn.errorMessage && (
                        <p className="text-xs text-loss flex items-center gap-1 mt-1">
                          <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{conn.errorMessage}</span>
                        </p>
                      )}
                      {conn.lastSync && (
                        <p className="text-xs text-foreground-muted mt-0.5">
                          Last sync: {new Date(conn.lastSync).toLocaleString()}
                        </p>
                      )}
                      {rowError && (
                        <p className="text-xs text-loss mt-1">{rowError}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:ml-4 sm:flex-shrink-0">
                      <label className="flex items-center gap-2 text-xs text-foreground-muted">
                        Bucket
                        {isOwner ? (
                          <select
                            // Default to 'other' if the backend returns a
                            // null/missing bucket (shouldn't happen with the
                            // server-side COALESCE, but be defensive).
                            value={conn.bucket ?? 'other'}
                            disabled={isUpdating}
                            onChange={(e) =>
                              handleBucketChange(
                                conn.accountId,
                                e.target.value as BucketName,
                              )
                            }
                            className="bg-background-secondary border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                          >
                            {BUCKET_NAMES.map((b) => (
                              <option key={b} value={b}>
                                {BUCKET_LABELS[b]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-foreground">
                            {BUCKET_LABELS[(conn.bucket ?? 'other') as BucketName]}
                          </span>
                        )}
                      </label>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      {isOwner && conn.connectionStatus !== 'connected' && (
                        <button
                          onClick={handleReconnect}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <LinkIcon className="h-3 w-3" />
                          Reconnect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <p className="mt-3 text-xs text-foreground-muted">
                Buckets classify accounts by trading strategy. Filters on positions,
                trades, risk, and analysis are applied per bucket. Reassigning is
                retroactive — past data immediately re-labels to the new bucket.
              </p>

              {!isLoading && !data?.connections?.length && !error && isOwner && (
                <button
                  onClick={handleReconnect}
                  className="w-full p-4 border border-dashed border-border rounded-lg text-foreground-muted hover:border-primary hover:text-primary transition"
                >
                  + Connect a Brokerage
                </button>
              )}

              {!isOwner && (
                <ReadOnlyNotice
                  className="mt-3"
                  hint="Only the account owner can connect brokerages or change buckets."
                />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
