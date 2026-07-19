'use client';

import { useEffect, useRef, memo } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme?: 'dark' | 'light';
  interval?: string;
  width?: string | number;
  height?: number;
  autosize?: boolean;
  showToolbar?: boolean;
  showDrawingToolsPanel?: boolean;
  showRangeSelector?: boolean;
  allowSymbolChange?: boolean;
  className?: string;
}

// TradingView Widget component using their official Advanced Chart widget
function TradingViewChartInner({
  symbol,
  theme = 'dark',
  interval = 'D',
  width = '100%',
  height = 500,
  autosize = true,
  showToolbar = true,
  showRangeSelector = true,
  allowSymbolChange = true,
  className = '',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptId = `tradingview-widget-${symbol}-${Date.now()}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any existing widget
    container.replaceChildren();

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.width = '100%';
    widgetDiv.style.height = '100%';
    widgetContainer.appendChild(widgetDiv);

    container.appendChild(widgetContainer);

    // Create and load TradingView widget script
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';

    // Widget configuration
    const config = {
      autosize: autosize,
      symbol: formatSymbol(symbol),
      interval: interval,
      timezone: 'America/New_York',
      theme: theme,
      style: '1', // Candlestick chart
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: !showToolbar,
      hide_legend: false,
      save_image: true,
      hide_volume: false,
      // Use dark background matching our theme
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      gridColor: theme === 'dark' ? '#2a2d31' : '#e0e0e0',
      // Studies to display
      studies: ['Volume@tv-basicstudies'],
      // Additional options
      show_popup_button: false,
      popup_width: '1000',
      popup_height: '650',
      range: showRangeSelector ? '12M' : undefined,
      // Toolbar configuration
      withdateranges: showRangeSelector,
      details: false,
      hotlist: false,
    };

    script.innerHTML = JSON.stringify(config);
    widgetContainer.appendChild(script);

    // Cleanup function — use the captured container, not the (possibly
    // changed) ref, per react-hooks guidance.
    return () => {
      container.replaceChildren();
    };
  }, [symbol, theme, interval, autosize, showToolbar, showRangeSelector, allowSymbolChange, scriptId]);

  return (
    <div
      ref={containerRef}
      className={`tradingview-chart ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: autosize ? '100%' : `${height}px`,
        minHeight: `${height}px`,
      }}
    />
  );
}

// Format symbol for TradingView — prefer backend-provided tvSymbol
function formatSymbol(symbol: string, tvSymbol?: string): string {
  // If backend provides a canonical TV symbol, use it directly
  if (tvSymbol) return tvSymbol;

  // Fallback: compute from raw ticker (legacy path)
  const cleanSymbol = symbol.toUpperCase().trim();

  // Crypto — use CRYPTO: prefix with USD suffix
  const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'DOGE', 'LINK', 'AVAX', 'MATIC', 'SHIB', 'PEPE', 'TRUMP'];
  if (cryptoSymbols.includes(cleanSymbol)) {
    return `CRYPTO:${cleanSymbol}USD`;
  }

  // Default to auto-detection (TradingView will figure it out)
  return cleanSymbol;
}

// Memoize to prevent unnecessary re-renders
export const TradingViewChart = memo(TradingViewChartInner);

// Alternative: Lightweight mini chart widget for smaller displays
export function TradingViewMiniChart({
  symbol,
  theme = 'dark',
  width = '100%',
  height = 220,
  className = '',
}: {
  symbol: string;
  theme?: 'dark' | 'light';
  width?: string | number;
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    container.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.type = 'text/javascript';

    const config = {
      symbol: formatSymbol(symbol),
      width: '100%',
      height: height,
      locale: 'en',
      dateRange: '12M',
      colorTheme: theme,
      isTransparent: false,
      autosize: false,
      largeChartUrl: '',
    };

    script.innerHTML = JSON.stringify(config);
    widgetContainer.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [symbol, theme, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: `${height}px`,
      }}
    />
  );
}

// Symbol info widget
export function TradingViewSymbolInfo({
  symbol,
  theme = 'dark',
  className = '',
}: {
  symbol: string;
  theme?: 'dark' | 'light';
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    container.appendChild(widgetContainer);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js';
    script.async = true;
    script.type = 'text/javascript';

    const config = {
      symbol: formatSymbol(symbol),
      width: '100%',
      locale: 'en',
      colorTheme: theme,
      isTransparent: false,
    };

    script.innerHTML = JSON.stringify(config);
    widgetContainer.appendChild(script);

    return () => {
      container.replaceChildren();
    };
  }, [symbol, theme]);

  return <div ref={containerRef} className={className} />;
}
