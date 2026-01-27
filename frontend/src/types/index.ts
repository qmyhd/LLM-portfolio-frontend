// Shared TypeScript types for the frontend

// Portfolio & Positions
export interface Position {
  symbol: string;
  companyName: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashBalance: number;
}

// Orders
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop_limit';
  status: 'filled' | 'pending' | 'cancelled';
  quantity: number;
  filledQuantity: number;
  price: number;
  limitPrice: number | null;
  stopPrice: number | null;
  createdAt: string;
  filledAt: string | null;
  totalValue: number;
}

// Stock Data
export interface StockProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  peRatio: number | null;
  dividendYield: number | null;
  beta: number | null;
  description: string;
}

export interface StockPrice {
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
}

export interface OHLCV {
  time: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Ideas
export type Direction = 'bullish' | 'bearish' | 'neutral';

export type TradingLabel =
  | 'TRADE_PLAN'
  | 'TRADE_EXECUTION'
  | 'TECHNICAL_ANALYSIS'
  | 'CATALYST_NEWS'
  | 'EARNINGS'
  | 'OPTIONS'
  | 'SECTOR_MACRO'
  | 'EDUCATIONAL'
  | 'MISC_CHATTER'
  | 'TRADE_OUTCOME';

export interface ParsedIdea {
  id: number;
  messageId: string;
  primarySymbol: string;
  direction: Direction;
  confidence: number;
  labels: TradingLabel[];
  entryPrice: number | null;
  targetPrice: number | null;
  stopLoss: number | null;
  text: string;
  author: string;
  sourceCreatedAt: string;
}

// Sentiment
export interface SentimentData {
  bullish: number;
  bearish: number;
  neutral: number;
  overall: Direction;
  score: number; // -1 to 1
}

// Watchlist
export interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// Search
export interface SearchResult {
  symbol: string;
  name: string;
  sector: string;
  type: 'stock' | 'etf';
}

// Chart
export interface ChartMarker {
  time: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
  label: string;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
