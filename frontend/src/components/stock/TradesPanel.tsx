'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { useStockTrades } from '@/hooks/useEnrichedTrades';
import { BlossomTradeCard } from '@/components/trade/BlossomTradeCard';

interface TradesPanelProps {
  ticker: string;
}

export function TradesPanel({ ticker }: TradesPanelProps) {
  const { data, error, isLoading } = useStockTrades(ticker, 20);

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton.Card key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-loss">Failed to load trades</p>
        <p className="text-xs text-foreground-subtle mt-1">{error.message}</p>
      </div>
    );
  }

  const trades = data?.trades ?? [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {trades.length === 0 ? (
          <EmptyState
            icon={ArrowsRightLeftIcon}
            title="No trades found"
            description={`No trade or dividend activity for ${ticker}`}
          />
        ) : (
          trades.map((trade) => (
            <BlossomTradeCard key={trade.id} trade={trade} showSymbol={false} />
          ))
        )}
      </div>
    </div>
  );
}
