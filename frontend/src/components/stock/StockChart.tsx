'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface StockChartProps {
  ticker: string;
  onOrderSelect?: (order: Order | null) => void;
}

interface Order {
  date: string;
  action: 'BUY' | 'SELL';
  qty: number;
  price: number;
  performanceSince?: {
    currentPrice: number;
    priceDiff: number;
    percentDiff: number;
    daysSince: number;
  };
}

type Period = '1D' | '1W' | '1M' | '3M' | '1Y' | '2Y';

// Mock OHLCV data generator
function generateMockOHLCV(ticker: string, days: number) {
  const data = [];
  let basePrice = 175;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.48) * 5;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = Math.floor(40000000 + Math.random() * 20000000);
    
    data.push({
      time: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });
    
    basePrice = close;
  }
  
  return data;
}

// Mock orders data
const mockOrders: Order[] = [
  { date: '2026-01-15', action: 'BUY', qty: 25, price: 168.50 },
  { date: '2026-01-10', action: 'BUY', qty: 50, price: 165.20 },
  { date: '2025-12-20', action: 'SELL', qty: 20, price: 172.80 },
  { date: '2025-11-15', action: 'BUY', qty: 45, price: 158.30 },
];

const periods: { label: Period; days: number }[] = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
];

export function StockChart({ ticker, onOrderSelect }: StockChartProps) {
  const [period, setPeriod] = useState<Period>('1M');
  const [showOrders, setShowOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [hoveredOrder, setHoveredOrder] = useState<Order | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartLoaded, setChartLoaded] = useState(false);

  const selectedPeriod = periods.find(p => p.label === period)!;
  const data = generateMockOHLCV(ticker, selectedPeriod.days);

  // Calculate stats
  const latestClose = data[data.length - 1]?.close || 0;
  const firstClose = data[0]?.close || latestClose;
  const priceChange = latestClose - firstClose;
  const priceChangePct = (priceChange / firstClose) * 100;
  const isPositive = priceChange >= 0;

  // Dynamic import of lightweight-charts (client-side only)
  useEffect(() => {
    let chart: any;
    let candleSeries: any;
    let volumeSeries: any;

    const initChart = async () => {
      if (!chartRef.current) return;

      const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts');

      // Clear previous chart
      chartRef.current.innerHTML = '';

      chart = createChart(chartRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#1a1a1a' },
          textColor: '#a0a0a0',
        },
        grid: {
          vertLines: { color: '#2a2d31' },
          horzLines: { color: '#2a2d31' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: '#2a2d31',
        },
        timeScale: {
          borderColor: '#2a2d31',
          timeVisible: true,
        },
        width: chartRef.current.clientWidth,
        height: chartRef.current.clientHeight,
      });

      // Add candlestick series
      candleSeries = chart.addCandlestickSeries({
        upColor: '#3ba55d',
        downColor: '#ed4245',
        borderUpColor: '#3ba55d',
        borderDownColor: '#ed4245',
        wickUpColor: '#3ba55d',
        wickDownColor: '#ed4245',
      });

      candleSeries.setData(data);

      // Add volume series
      volumeSeries = chart.addHistogramSeries({
        color: '#5865f2',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(59, 165, 93, 0.5)' : 'rgba(237, 66, 69, 0.5)',
      })));

      // Add order markers if enabled
      if (showOrders) {
        const markers = mockOrders
          .filter(order => {
            const orderDate = new Date(order.date);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - selectedPeriod.days);
            return orderDate >= startDate;
          })
          .map(order => ({
            time: order.date,
            position: order.action === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
            color: order.action === 'BUY' ? '#3ba55d' : '#ed4245',
            shape: order.action === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
            text: `${order.action} ${order.qty} @ $${order.price.toFixed(2)}`,
            id: order.date,
          }));

        candleSeries.setMarkers(markers);
      }

      // Subscribe to click events for marker interaction
      chart.subscribeClick((param: any) => {
        if (param.point && param.time) {
          const clickedOrder = mockOrders.find(o => o.date === param.time);
          if (clickedOrder) {
            // Calculate performance since order
            const currentPrice = latestClose;
            const priceDiff = currentPrice - clickedOrder.price;
            const percentDiff = (priceDiff / clickedOrder.price) * 100;
            const orderDate = new Date(clickedOrder.date);
            const daysSince = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
            
            const orderWithPerformance: Order = {
              ...clickedOrder,
              performanceSince: {
                currentPrice,
                priceDiff,
                percentDiff,
                daysSince,
              },
            };
            
            setSelectedOrder(orderWithPerformance);
            onOrderSelect?.(orderWithPerformance);
          }
        }
      });

      // Subscribe to crosshair move for hover tooltip
      chart.subscribeCrosshairMove((param: any) => {
        if (param.point && param.time) {
          const hoveredOrderData = mockOrders.find(o => o.date === param.time);
          if (hoveredOrderData) {
            setHoveredOrder(hoveredOrderData);
            setTooltipPosition({ x: param.point.x, y: param.point.y });
          } else {
            setHoveredOrder(null);
          }
        } else {
          setHoveredOrder(null);
        }
      });

      chart.timeScale().fitContent();
      setChartLoaded(true);

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        if (chartRef.current) {
          chart.applyOptions({
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,
          });
        }
      });

      resizeObserver.observe(chartRef.current);

      return () => {
        resizeObserver.disconnect();
        chart.remove();
      };
    };

    initChart();

    return () => {
      if (chart) {
        chart.remove();
      }
    };
  }, [ticker, period, showOrders, data, selectedPeriod.days]);

  return (
    <div className="h-full flex flex-col">
      {/* Chart header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-4">
          {/* Period selector */}
          <div className="flex rounded-lg bg-tertiary p-1">
            {periods.map(p => (
              <button
                key={p.label}
                onClick={() => setPeriod(p.label)}
                className={clsx(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  period === p.label
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-foreground'
                )}
              >
                {p.label}
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
        <div className={clsx(
          'text-sm font-mono font-medium',
          isPositive ? 'text-profit' : 'text-loss'
        )}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePct.toFixed(2)}%)
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 relative min-h-[300px] lg:min-h-0">
        <div ref={chartRef} className="absolute inset-0" />
        
        {/* Hover tooltip */}
        {hoveredOrder && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(tooltipPosition.x, (chartRef.current?.clientWidth || 300) - 160),
              top: tooltipPosition.y - 60,
            }}
          >
            <div className="bg-secondary border border-border rounded-lg shadow-lg p-2 text-xs">
              <div className={clsx(
                'flex items-center gap-1 font-medium',
                hoveredOrder.action === 'BUY' ? 'text-profit' : 'text-loss'
              )}>
                {hoveredOrder.action === 'BUY' ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" />
                )}
                {hoveredOrder.action} {hoveredOrder.qty} shares
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
        
        {/* Loading state */}
        {!chartLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <div className="animate-pulse text-muted">Loading chart...</div>
          </div>
        )}
      </div>

      {/* Selected Order Detail Panel */}
      {selectedOrder && (
        <div className="border-t border-border bg-secondary p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'p-2 rounded-lg',
                selectedOrder.action === 'BUY' ? 'bg-profit/20' : 'bg-loss/20'
              )}>
                {selectedOrder.action === 'BUY' ? (
                  <ArrowUpIcon className="h-5 w-5 text-profit" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5 text-loss" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'font-medium',
                    selectedOrder.action === 'BUY' ? 'text-profit' : 'text-loss'
                  )}>
                    {selectedOrder.action}
                  </span>
                  <span className="text-foreground font-medium">
                    {selectedOrder.qty} shares @ ${selectedOrder.price.toFixed(2)}
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
                <p className={clsx(
                  'text-sm font-mono font-medium',
                  selectedOrder.performanceSince.priceDiff >= 0 ? 'text-profit' : 'text-loss'
                )}>
                  {selectedOrder.performanceSince.priceDiff >= 0 ? '+' : ''}
                  ${selectedOrder.performanceSince.priceDiff.toFixed(2)}
                  ({selectedOrder.performanceSince.percentDiff >= 0 ? '+' : ''}
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
