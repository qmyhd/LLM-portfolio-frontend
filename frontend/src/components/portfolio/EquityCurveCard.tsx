'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatSignedPct } from '@/lib/format';
import { useBucket, withBucket } from '@/contexts/BucketContext';
import { BUCKET_LABELS } from '@/lib/bucket';
import type { EquityCurveResponse, ReturnSeriesResponse } from '@/types/api';

type RangeOption = '1W' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL';
type CurveMode = 'return' | 'value';

const RANGES: { key: RangeOption; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: 'YTD', label: 'YTD' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'ALL' },
];

const RETURN_NOTE =
  'Performance of the stocks you currently hold, repriced over this period — not your actual account history.';
const VALUE_NOTE =
  'Actual account value from nightly snapshots — includes deposits, withdrawals, and position changes.';

const LS_CURVE_MODE = 'equity-curve-mode';

/** Days for the equity-curve endpoint (min 7, max 730 per backend). */
function rangeToDays(range: RangeOption): number {
  switch (range) {
    case '1W': return 7;
    case '1M': return 30;
    case '3M': return 90;
    case 'YTD': {
      const now = new Date();
      const jan1 = new Date(now.getFullYear(), 0, 1);
      const days = Math.ceil((now.getTime() - jan1.getTime()) / 86_400_000);
      return Math.min(730, Math.max(7, days));
    }
    case '1Y': return 365;
    case 'ALL': return 730;
  }
}

const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Curve fetch failed (${res.status})`);
  return res.json();
};

const fmtUsd = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * Portfolio curve with two modes:
 * - Return: flow-free % return of the CURRENT holdings, normalized to 0% at
 *   the window start (baseline series: green above 0, red below).
 * - Value: the account's actual dollar equity per day from nightly
 *   position_snapshots (area series) — the "what am I actually worth" view.
 */
export function EquityCurveCard() {
  const bucket = useBucket();
  const [range, setRange] = useState<RangeOption>('3M');
  const [mode, setMode] = useState<CurveMode>('return');
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LS_CURVE_MODE);
    if (stored === 'return' || stored === 'value') setMode(stored);
  }, []);

  const switchMode = (next: CurveMode) => {
    setMode(next);
    localStorage.setItem(LS_CURVE_MODE, next);
  };

  const returnUrl = withBucket(`/api/portfolio/return-series?period=${range}`, bucket);
  const valueUrl = withBucket(`/api/portfolio/equity-curve?days=${rangeToDays(range)}`, bucket);

  const returnQuery = useSWR<ReturnSeriesResponse>(
    mode === 'return' ? returnUrl : null,
    fetchJson,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );
  const valueQuery = useSWR<EquityCurveResponse>(
    mode === 'value' ? valueUrl : null,
    fetchJson,
    { revalidateOnFocus: false, dedupingInterval: 300_000 },
  );

  const isLoading = mode === 'return' ? returnQuery.isLoading : valueQuery.isLoading;
  const error = mode === 'return' ? returnQuery.error : valueQuery.error;

  // Stable identities so the chart effect only re-runs when data changes,
  // not on every render (`?? []` would mint a new array each time).
  const returnPoints = useMemo(() => returnQuery.data?.points ?? [], [returnQuery.data]);
  const valuePoints = useMemo(() => valueQuery.data?.points ?? [], [valueQuery.data]);
  const pointCount = mode === 'return' ? returnPoints.length : valuePoints.length;

  // Headline numbers
  const periodChange = returnQuery.data?.periodReturnPct ?? null;
  const latestEquity = valuePoints.length ? valuePoints[valuePoints.length - 1].equity : null;
  const firstEquity = valuePoints.length ? valuePoints[0].equity : null;
  const valueDelta = latestEquity != null && firstEquity != null ? latestEquity - firstEquity : null;
  const valueDeltaPct =
    valueDelta != null && firstEquity ? (valueDelta / firstEquity) * 100 : null;

  const headlinePct = mode === 'return' ? periodChange : valueDeltaPct;
  const isPositive = (headlinePct ?? 0) >= 0;

  useEffect(() => {
    if (!chartContainerRef.current || pointCount < 2) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { createChart, ColorType, LineStyle } = await import('lightweight-charts');
      if (cancelled || !chartContainerRef.current) return;

      chartContainerRef.current.replaceChildren();
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

      if (mode === 'return') {
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
          returnPoints.map((p) => ({
            time: p.date as unknown as never, // lightweight-charts accepts YYYY-MM-DD
            value: p.returnPct,
          })),
        );
      } else {
        // Dollar-value area series.
        const series = chart.addAreaSeries({
          lineColor: '#5865f2',
          topColor: 'rgba(88,101,242,0.35)',
          bottomColor: 'rgba(88,101,242,0.02)',
          lineWidth: 2,
          priceFormat: {
            type: 'custom',
            formatter: (v: number) => fmtUsd(v),
            minMove: 1,
          },
        });
        series.setData(
          valuePoints.map((p) => ({
            time: p.date as unknown as never,
            value: p.equity,
          })),
        );
      }

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
      console.error('Portfolio curve init failed:', e);
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // returnPoints/valuePoints identity changes with the data they derive from
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, returnPoints, valuePoints, pointCount]);

  const bucketLabel = bucket ? BUCKET_LABELS[bucket] : 'All buckets';

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground-muted">
            {mode === 'return' ? 'Return' : 'Account value'} · {bucketLabel}
          </p>
          {mode === 'return' ? (
            periodChange != null ? (
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
            )
          ) : latestEquity != null ? (
            <p className="text-2xl font-semibold tabular-nums mt-0.5 flex items-center gap-2">
              {fmtUsd(latestEquity)}
              {valueDeltaPct != null && (
                <span
                  className={clsx(
                    'text-xs font-normal flex items-center gap-0.5',
                    isPositive ? 'text-profit' : 'text-loss',
                  )}
                >
                  {isPositive ? (
                    <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
                  )}
                  {formatSignedPct(valueDeltaPct)} over {range}
                </span>
              )}
            </p>
          ) : (
            <Skeleton.Line className="h-7 w-32 mt-1" />
          )}
          <p className="text-[10px] text-foreground-subtle mt-0.5 max-w-xs">
            {mode === 'return' ? RETURN_NOTE : VALUE_NOTE}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {(['return', 'value'] as CurveMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={clsx(
                  'px-2 py-0.5 text-xs transition-colors',
                  mode === m
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-muted hover:text-foreground',
                )}
              >
                {m === 'return' ? 'Return %' : 'Value $'}
              </button>
            ))}
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
      </div>

      {/* Chart container */}
      <div className="relative h-48">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton.Line className="h-full w-full" />
          </div>
        )}
        {!isLoading && !error && pointCount < 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-sm text-foreground-muted">
              {mode === 'return' ? 'Not enough price history yet' : 'Not enough snapshots yet'}
            </p>
            <p className="text-xs text-foreground-subtle mt-1">
              {mode === 'return'
                ? 'The return curve needs at least two trading days of data for your current holdings.'
                : 'The value curve builds up as the nightly pipeline records daily snapshots.'}
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-loss">Couldn&apos;t load the curve.</p>
          </div>
        )}
        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
