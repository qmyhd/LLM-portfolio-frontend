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
  showDrawingToolsPanel = false,
  showRangeSelector = true,
  allowSymbolChange = true,
  className = '',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptId = `tradingview-widget-${symbol}-${Date.now()}`;

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing widget
    containerRef.current.innerHTML = '';

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

    containerRef.current.appendChild(widgetContainer);

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

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
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

// Format symbol for TradingView (e.g., AAPL -> NASDAQ:AAPL)
function formatSymbol(symbol: string): string {
  // Clean up the symbol
  const cleanSymbol = symbol.toUpperCase().trim();

  // Common crypto symbols
  const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOT', 'DOGE', 'LINK', 'AVAX', 'MATIC'];
  if (cryptoSymbols.includes(cleanSymbol) || cleanSymbol.endsWith('USD') || cleanSymbol.endsWith('USDT')) {
    return `CRYPTO:${cleanSymbol}USD`;
  }

  // Common forex pairs
  if (cleanSymbol.length === 6 && /^[A-Z]+$/.test(cleanSymbol)) {
    const possibleForex = ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF'];
    const base = cleanSymbol.substring(0, 3);
    const quote = cleanSymbol.substring(3);
    if (possibleForex.includes(base) && possibleForex.includes(quote)) {
      return `FX:${cleanSymbol}`;
    }
  }

  // Nasdaq-listed stocks (common tech)
  const nasdaqStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'INTC',
    'NFLX', 'QCOM', 'ADBE', 'PYPL', 'SBUX', 'CMCSA', 'CSCO', 'COST', 'PEP', 'AVGO',
    'TXN', 'MU', 'AMAT', 'LRCX', 'KLAC', 'ASML', 'MRVL', 'SNPS', 'CDNS', 'PANW',
    'CRWD', 'ZS', 'DDOG', 'NET', 'SNOW', 'MDB', 'COIN', 'HOOD', 'ABNB', 'RIVN',
    'LCID', 'PLTR', 'SOFI', 'UPST', 'AFRM', 'ROKU', 'TTD', 'DOCU', 'ZM', 'OKTA',
  ];

  if (nasdaqStocks.includes(cleanSymbol)) {
    return `NASDAQ:${cleanSymbol}`;
  }

  // NYSE-listed stocks
  const nyseStocks = [
    'JPM', 'V', 'MA', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'BLK',
    'DIS', 'NKE', 'KO', 'PG', 'JNJ', 'UNH', 'CVX', 'XOM', 'CRM', 'ORCL',
    'IBM', 'HD', 'WMT', 'TGT', 'LOW', 'MCD', 'CAT', 'DE', 'BA', 'GE',
    'F', 'GM', 'UBER', 'LYFT', 'SQ', 'BRK.A', 'BRK.B', 'T', 'VZ',
  ];

  if (nyseStocks.includes(cleanSymbol)) {
    return `NYSE:${cleanSymbol}`;
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
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    containerRef.current.appendChild(widgetContainer);

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
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
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
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetContainer.appendChild(widgetDiv);

    containerRef.current.appendChild(widgetContainer);

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
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return <div ref={containerRef} className={className} />;
}
