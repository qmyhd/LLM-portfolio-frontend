'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatSignedPct } from '@/lib/format';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { BUCKET_LABELS } from '@/lib/bucket';
import type { ReturnSeriesResponse } from '@/types/api';

type RangeOption = '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';

const RANGES: { key: RangeOption; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: 'YTD', label: 'YTD' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'ALL' },
];

const CLARITY_NOTE =
  'Performance of the stocks you currently hold, repriced over this period — not your actual account history.';

const fetcher = async (url: string): Promise<ReturnSeriesResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Return series fetch failed (${res.status})`);
  return res.json();
};

/**
 * Flow-free % return curve for the active bucket's current holdings, normalized
 * to 0% at the window start (baseline series: green above 0, red below).
 */
export function EquityCurveCard() {
  const bucket = useBucket();
  const [range, setRange] = useState<RangeOption>('3M');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const url = withBucket(`/api/portfolio/return-series?period=${range}`, bucket);
  const { data, error, isLoading } = useSWR<ReturnSeriesResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  const points = data?.points ?? [];
  const periodChange = data?.periodReturnPct ?? null;
  const isPositive = (periodChange ?? 0) >= 0;

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

      // Baseline series anchored at 0% — green above, red below.
      const series = chart.addBaselineSeries({
        baseValue: { type: 'price', price: 0 },
        topLineColor: '#3ba55d',
        topFillColor1: 'rgba(59,165,93,0.4)',
        topFillColor2: 'rgba(59,165,93,0.05)',
        bottomLineColor: '#ed4245',
        bottomFillColor1: 'rgba(237,66,69,0.05)',
        bottomFillColor2: 'rgba(237,66,69,0.4)',
        lineWidth: 2,
        priceFormat: { type: 'percent', precision: 2 },
      });

      series.setData(
        points.map((p) => ({
          time: p.date as unknown as never, // lightweight-charts accepts YYYY-MM-DD
          value: p.returnPct,
        })),
      );
      chart.timeScale().fitContent();

      const onResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        window.removeEventListener('resize', onResize);
        chart.remove();
      };
    };

    init().catch((e) => {
      console.error('Return curve init failed:', e);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [points]);

  const bucketLabel = bucket ? BUCKET_LABELS[bucket] : 'All buckets';

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground-muted">
            Return · {bucketLabel}
          </p>
          {periodChange != null ? (
            <p
              className={clsx(
                'text-2xl font-semibold tabular-nums mt-0.5 flex items-center gap-1',
                isPositive ? 'text-profit' : 'text-loss',
              )}
            >
              {isPositive ? (
                <ArrowTrendingUpIcon className="h-4 w-4" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4" />
              )}
              {formatSignedPct(periodChange)}
              <span className="text-xs font-normal text-foreground-muted">over {range}</span>
            </p>
          ) : (
            <Skeleton.Line className="h-7 w-32 mt-1" />
          )}
          <p className="text-[10px] text-foreground-subtle mt-0.5 max-w-xs">{CLARITY_NOTE}</p>
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
            <p className="text-sm text-foreground-muted">Not enough price history yet</p>
            <p className="text-xs text-foreground-subtle mt-1">
              The return curve needs at least two trading days of data for your current holdings.
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-loss">Couldn&apos;t load the return curve.</p>
          </div>
        )}
        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
