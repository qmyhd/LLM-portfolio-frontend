'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatMoney, formatSignedPct } from '@/lib/format';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { BUCKET_LABELS } from '@/lib/bucket';

interface EquityPoint {
  date: string;
  equity: number;
}

interface EquityCurveResponse {
  points: EquityPoint[];
  bucket: string;
  days: number;
}

type RangeOption = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const RANGES: { key: RangeOption; days: number; label: string }[] = [
  { key: '1M', days: 30, label: '1M' },
  { key: '3M', days: 90, label: '3M' },
  { key: '6M', days: 180, label: '6M' },
  { key: '1Y', days: 365, label: '1Y' },
  { key: 'ALL', days: 730, label: 'ALL' },
];

const fetcher = async (url: string): Promise<EquityCurveResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Equity curve fetch failed (${res.status})`);
  }
  return res.json();
};

/**
 * Daily portfolio equity time-series chart, scoped to the active bucket.
 *
 * Powered by lightweight-charts (already a dep used by StockChart) so we
 * don't pull in a new charting library. Reads bucket from BucketContext
 * and re-fetches when the user switches buckets.
 *
 * Renders a header showing the latest equity value + period % change, a
 * time-range tab strip, and the area chart. Empty/sparse data → friendly
 * empty state with hint about the nightly snapshot pipeline.
 */
export function EquityCurveCard() {
  const bucket = useBucket();
  const [range, setRange] = useState<RangeOption>('3M');
  const days = RANGES.find((r) => r.key === range)?.days ?? 90;
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const url = withBucket(`/api/portfolio/equity-curve?days=${days}`, bucket);
  const { data, error, isLoading } = useSWR<EquityCurveResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  // Derived summary stats
  const points = data?.points ?? [];
  const first = points[0];
  const last = points[points.length - 1];
  const periodChange = last && first && first.equity > 0
    ? ((last.equity - first.equity) / first.equity) * 100
    : null;
  const isPositive = (periodChange ?? 0) >= 0;

  // Render chart whenever data or container size changes
  useEffect(() => {
    if (!chartContainerRef.current || points.length < 2) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
      if (cancelled || !chartContainerRef.current) return;

      chartContainerRef.current.innerHTML = '';
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#a0a0a0',
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { color: '#2a2d3120', style: LineStyle.Dotted },
        },
        rightPriceScale: { borderColor: '#2a2d31' },
        timeScale: { borderColor: '#2a2d31', timeVisible: false, fixLeftEdge: true, fixRightEdge: true },
        crosshair: { mode: 1 },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        handleScroll: false,
        handleScale: false,
      });

      const series = chart.addAreaSeries({
        lineColor: isPositive ? '#3ba55d' : '#ed4245',
        topColor: isPositive ? 'rgba(59,165,93,0.4)' : 'rgba(237,66,69,0.4)',
        bottomColor: isPositive ? 'rgba(59,165,93,0.05)' : 'rgba(237,66,69,0.05)',
        lineWidth: 2,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });

      series.setData(
        points.map((p) => ({
          time: p.date as unknown as never, // lightweight-charts accepts YYYY-MM-DD strings
          value: p.equity,
        })),
      );
      chart.timeScale().fitContent();

      // Handle container resize
      const onResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        chart.remove();
      };
    };

    init().catch((e) => {
      console.error('Equity chart init failed:', e);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [points, isPositive]);

  const bucketLabel = bucket ? BUCKET_LABELS[bucket] : 'All buckets';

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground-muted">
            Equity curve · {bucketLabel}
          </p>
          {last ? (
            <p className="text-2xl font-semibold tabular-nums mt-0.5">
              {formatMoney(last.equity)}
            </p>
          ) : (
            <Skeleton.Line className="h-7 w-32 mt-1" />
          )}
          {periodChange != null && (
            <p
              className={clsx(
                'text-xs font-medium flex items-center gap-1 mt-0.5',
                isPositive ? 'text-profit' : 'text-loss',
              )}
            >
              {isPositive ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              {formatSignedPct(periodChange)} over {range}
            </p>
          )}
        </div>

        {/* Time-range tabs */}
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={clsx(
                'px-2 py-0.5 text-xs rounded-md transition-colors',
                range === r.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-hover',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-48">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton.Line className="h-full w-full" />
          </div>
        )}
        {!isLoading && !error && points.length < 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm text-foreground-muted">No equity history yet</p>
            <p className="text-xs text-foreground-subtle mt-1">
              {bucket
                ? 'Switch buckets above, or wait for the next nightly snapshot to record the first data point.'
                : 'Position snapshots are recorded nightly by the EC2 pipeline. The curve will populate over time.'}
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-loss">Couldn&apos;t load the equity curve.</p>
          </div>
        )}
        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
