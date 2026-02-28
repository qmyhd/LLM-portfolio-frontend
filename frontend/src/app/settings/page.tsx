'use client';

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
  const { data, error, isLoading } = useSWR<ConnectionsResponse>(
    '/api/connections',
    fetcher,
  );

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

                return (
                  <div
                    key={conn.accountId}
                    className="card flex items-center justify-between p-4 mb-2"
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
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                      {conn.connectionStatus !== 'connected' && (
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

              {!isLoading && !data?.connections?.length && !error && (
                <button
                  onClick={handleReconnect}
                  className="w-full p-4 border border-dashed border-border rounded-lg text-foreground-muted hover:border-primary hover:text-primary transition"
                >
                  + Connect a Brokerage
                </button>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
