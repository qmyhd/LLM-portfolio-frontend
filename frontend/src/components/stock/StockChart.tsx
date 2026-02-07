'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import useSWR from 'swr';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { OHLCVSeries, OHLCVBar, ChartOrder } from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StockChartProps {
  ticker: string;
  onOrderSelect?: (order: SelectedOrder | null) => void;
}

interface SelectedOrder extends ChartOrder {
  performanceSince?: {
    currentPrice: number;
    priceDiff: number;
    percentDiff: number;
    daysSince: number;
  };
}

type Period = '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y';

const periods: Period[] = ['1W', '1M', '3M', '6M', '1Y', '2Y'];

// ---------------------------------------------------------------------------
// SWR fetcher (client-side, hits Next.js BFF route)
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`OHLCV fetch failed (${r.status})`);
    return r.json() as Promise<OHLCVSeries>;
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert "YYYY-MM-DD" to UTC seconds (lightweight-charts wants UTCTimestamp). */
function dateToUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 1000;
}

/** Check if user prefers reduced motion. */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StockChart({ ticker, onOrderSelect }: StockChartProps) {
  const [period, setPeriod] = useState<Period>('6M');
  const [showOrders, setShowOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
  const [hoveredOrder, setHoveredOrder] = useState<ChartOrder | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real OHLCV data via BFF
  const { data: series, error, isLoading } = useSWR<OHLCVSeries>(
    `/api/stocks/${ticker}/ohlcv?period=${period}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  // Derived stats
  const stats = useMemo(() => {
    if (!series?.data?.length) return null;
    const first = series.data[0];
    const last = series.data[series.data.length - 1];
    const change = last.close - first.close;
    const changePct = (change / first.close) * 100;
    return { latestClose: last.close, change, changePct, isPositive: change >= 0 };
  }, [series]);

  // Build the chart
  useEffect(() => {
    if (!chartContainerRef.current || !series?.data?.length) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chart: any;
    let cancelled = false;

    const init = async () => {
      const {
        createChart,
        ColorType,
        CrosshairMode,
      } = await import('lightweight-charts');

      if (cancelled || !chartContainerRef.current) return;

      // Clear any previous chart
      chartContainerRef.current.innerHTML = '';

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#1a1a1a' },
          textColor: '#a0a0a0',
          fontFamily: "'Inter', sans-serif",
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { color: '#2a2d3120' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#2a2d31' },
        timeScale: { borderColor: '#2a2d31', timeVisible: false },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });

      // ---- Candlestick series ----
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#3ba55d',
        downColor: '#ed4245',
        borderUpColor: '#3ba55d',
        borderDownColor: '#ed4245',
        wickUpColor: '#3ba55d',
        wickDownColor: '#ed4245',
      });

      candleSeries.setData(
        series.data.map((bar: OHLCVBar) => ({
          time: dateToUTC(bar.date),
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        })),
      );

      // ---- Volume histogram ----
      const volumeSeries = chart.addHistogramSeries({
        color: '#5865f2',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(
        series.data.map((bar: OHLCVBar) => ({
          time: dateToUTC(bar.date),
          value: bar.volume,
          color:
            bar.close >= bar.open
              ? 'rgba(59, 165, 93, 0.35)'
              : 'rgba(237, 66, 69, 0.35)',
        })),
      );

      // ---- Order markers ----
      if (showOrders && series.orders?.length) {
        const markers = series.orders
          .slice()                              // don't mutate source
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((o: ChartOrder) => ({
            time: dateToUTC(o.date),
            position: o.action === 'BUY' ? ('belowBar' as const) : ('aboveBar' as const),
            color: o.action === 'BUY' ? '#3ba55d' : '#ef5350',
            shape: o.action === 'BUY' ? ('arrowUp' as const) : ('arrowDown' as const),
            text: `${o.action} ${o.quantity}`,
          }));
        candleSeries.setMarkers(markers);
      }

      // ---- Click → select order ----
      chart.subscribeClick((param: { point?: { x: number; y: number }; time?: number }) => {
        if (!param.point || param.time == null) return;
        const clicked = series.orders?.find(
          (o) => dateToUTC(o.date) === param.time,
        );
        if (clicked && stats) {
          const priceDiff = stats.latestClose - clicked.price;
          const percentDiff = (priceDiff / clicked.price) * 100;
          const daysSince = Math.floor(
            (Date.now() - new Date(clicked.date).getTime()) / 86_400_000,
          );
          const enriched: SelectedOrder = {
            ...clicked,
            performanceSince: {
              currentPrice: stats.latestClose,
              priceDiff,
              percentDiff,
              daysSince,
            },
          };
          setSelectedOrder(enriched);
          onOrderSelect?.(enriched);
        }
      });

      // ---- Crosshair hover → tooltip ----
      chart.subscribeCrosshairMove(
        (param: { point?: { x: number; y: number }; time?: number }) => {
          if (param.point && param.time != null) {
            const hovered = series.orders?.find(
              (o) => dateToUTC(o.date) === param.time,
            );
            if (hovered) {
              setHoveredOrder(hovered);
              setTooltipPos({ x: param.point.x, y: param.point.y });
              return;
            }
          }
          setHoveredOrder(null);
        },
      );

      chart.timeScale().fitContent();

      // ---- Fade-in animation (Anime.js) ----
      if (!prefersReducedMotion()) {
        try {
          const { animate } = await import('animejs');
          animate(chartContainerRef.current, {
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutCubic',
          });
        } catch {
          // Anime.js optional — silently degrade
          if (chartContainerRef.current) chartContainerRef.current.style.opacity = '1';
        }
      }

      // ---- Resize observer ----
      const ro = new ResizeObserver(() => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      });
      ro.observe(chartContainerRef.current!);

      return () => {
        ro.disconnect();
        chart?.remove();
      };
    };

    init();

    return () => {
      cancelled = true;
      chart?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, showOrders]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          {/* Period selector */}
          <div className="flex rounded-lg bg-tertiary p-1">
            {periods.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  period === p
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-foreground',
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Toggle orders */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOrders}
              onChange={(e) => setShowOrders(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-tertiary text-accent focus:ring-accent"
            />
            <span className="text-sm text-muted">Orders</span>
          </label>
        </div>

        {/* Price change summary */}
        {stats && (
          <div
            className={clsx(
              'text-sm font-mono font-medium',
              stats.isPositive ? 'text-profit' : 'text-loss',
            )}
          >
            {stats.isPositive ? '+' : ''}
            {stats.change.toFixed(2)} ({stats.isPositive ? '+' : ''}
            {stats.changePct.toFixed(2)}%)
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative min-h-[300px] lg:min-h-0">
        {/* The actual chart mounts here */}
        <div ref={chartContainerRef} className="absolute inset-0" style={{ opacity: 0 }} />

        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-sm text-muted">Loading chart data&hellip;</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary gap-2">
            <span className="text-sm text-loss font-medium">Failed to load chart</span>
            <span className="text-xs text-muted">{(error as Error).message}</span>
          </div>
        )}

        {/* Empty state (no data) */}
        {!isLoading && !error && series && series.data.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary gap-2">
            <span className="text-sm text-muted">No OHLCV data for {ticker}</span>
            <span className="text-xs text-muted">Try a different period or check the backfill.</span>
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredOrder && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(
                tooltipPos.x,
                (chartContainerRef.current?.clientWidth || 300) - 160,
              ),
              top: tooltipPos.y - 60,
            }}
          >
            <div className="bg-secondary border border-border rounded-lg shadow-lg p-2 text-xs">
              <div
                className={clsx(
                  'flex items-center gap-1 font-medium',
                  hoveredOrder.action === 'BUY' ? 'text-profit' : 'text-loss',
                )}
              >
                {hoveredOrder.action === 'BUY' ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" />
                )}
                {hoveredOrder.action} {hoveredOrder.quantity} shares
              </div>
              <div className="text-muted mt-1">
                @ ${hoveredOrder.price.toFixed(2)}
              </div>
              <div className="text-muted">
                {new Date(hoveredOrder.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Order Detail Panel */}
      {selectedOrder && (
        <div className="border-t border-border bg-secondary p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  selectedOrder.action === 'BUY' ? 'bg-profit/20' : 'bg-loss/20',
                )}
              >
                {selectedOrder.action === 'BUY' ? (
                  <ArrowUpIcon className="h-5 w-5 text-profit" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5 text-loss" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'font-medium',
                      selectedOrder.action === 'BUY' ? 'text-profit' : 'text-loss',
                    )}
                  >
                    {selectedOrder.action}
                  </span>
                  <span className="text-foreground font-medium">
                    {selectedOrder.quantity} shares @ ${selectedOrder.price.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-muted">
                  {new Date(selectedOrder.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedOrder(null);
                onOrderSelect?.(null);
              }}
              className="p-1 rounded hover:bg-tertiary text-muted hover:text-foreground"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Performance since order */}
          {selectedOrder.performanceSince && (
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted">Current Price</p>
                <p className="text-sm font-mono font-medium text-foreground">
                  ${selectedOrder.performanceSince.currentPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">P/L per Share</p>
                <p
                  className={clsx(
                    'text-sm font-mono font-medium',
                    selectedOrder.performanceSince.priceDiff >= 0
                      ? 'text-profit'
                      : 'text-loss',
                  )}
                >
                  {selectedOrder.performanceSince.priceDiff >= 0 ? '+' : ''}$
                  {selectedOrder.performanceSince.priceDiff.toFixed(2)} (
                  {selectedOrder.performanceSince.percentDiff >= 0 ? '+' : ''}
                  {selectedOrder.performanceSince.percentDiff.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Days Held</p>
                <p className="text-sm font-mono font-medium text-foreground">
                  {selectedOrder.performanceSince.daysSince}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
