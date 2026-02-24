'use client';

import { useManagement } from '@/hooks/useOpenBB';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { formatCompact } from '@/lib/format';

interface ManagementTeamProps {
  ticker: string;
}

export function ManagementTeam({ ticker }: ManagementTeamProps) {
  const { data, isLoading, error } = useManagement(ticker);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-foreground-muted text-sm">
        Failed to load management data
      </div>
    );
  }

  if (!data?.executives?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-foreground-muted">
        <UserGroupIcon className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No management data available</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {data.executives.map((exec, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg border border-border/50"
        >
          {/* Avatar placeholder */}
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {exec.name.charAt(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground truncate">
                {exec.name}
              </span>
            </div>
            <p className="text-xs text-foreground-muted truncate">{exec.title}</p>
            <div className="flex items-center gap-3 mt-1">
              {exec.pay != null && (
                <span className="text-2xs text-foreground-subtle">
                  Pay: ${formatCompact(exec.pay)}
                </span>
              )}
              {exec.titleSince && (
                <span className="text-2xs text-foreground-subtle">
                  Since {exec.titleSince}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
