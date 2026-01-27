/**
 * API Types - Shared TypeScript interfaces for Backend API communication
 *
 * These types match the FastAPI response schemas in the backend.
 * Keep in sync with src/api/routes/*.py in LLM-portfolio-project.
 */

// =============================================================================
// Portfolio & Positions
// =============================================================================

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashBalance: number;
  positionsCount: number;
  lastSync: string; // ISO timestamp
}

export interface Position {
  symbol: string;
  accountId: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  equity: number;
  openPnl: number;
  openPnlPercent: number;
  dayChange: number | null;
  dayChangePercent: number | null;
  rawSymbol: string | null;
}

export interface PortfolioResponse {
  summary: PortfolioSummary;
  positions: Position[];
}

// =============================================================================
// Orders
// =============================================================================

export interface Order {
  brokerageOrderId: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  orderType: 'market' | 'limit' | 'stop_limit';
  status: 'executed' | 'pending' | 'cancelled' | 'rejected';
  totalQuantity: number;
  executionPrice: number | null;
  limitPrice: number | null;
  stopPrice: number | null;
  timeExecuted: string | null; // ISO timestamp
  timePlaced: string | null; // ISO timestamp
  notifiedAt: string | null; // ISO timestamp for Discord notification
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// Stock Profile
// =============================================================================

export interface StockProfileCurrent {
  ticker: string;
  lastUpdated: string; // ISO timestamp

  // Price metrics (from RDS ohlcv_daily)
  latestClosePrice: number | null;
  previousClosePrice: number | null;
  dailyChangePct: number | null;
  return1wPct: number | null;
  return1mPct: number | null;
  return3mPct: number | null;
  return1yPct: number | null;
  volatility30d: number | null;
  volatility90d: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  avgVolume30d: number | null;

  // Position metrics (from positions/orders)
  currentPositionQty: number | null;
  currentPositionValue: number | null;
  avgBuyPrice: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  totalOrdersCount: number;
  buyOrdersCount: number;
  sellOrdersCount: number;
  avgOrderSize: number | null;
  firstTradeDate: string | null;
  lastTradeDate: string | null;

  // Sentiment metrics (from discord_parsed_ideas)
  totalMentionCount: number;
  mentionCount30d: number;
  mentionCount7d: number;
  avgSentimentScore: number | null;
  bullishMentionPct: number | null;
  bearishMentionPct: number | null;
  neutralMentionPct: number | null;
  firstMentionedAt: string | null;
  lastMentionedAt: string | null;

  // Label counts
  labelTradeExecutionCount: number;
  labelTradePlanCount: number;
  labelTechnicalAnalysisCount: number;
  labelOptionsCount: number;
  labelCatalystNewsCount: number;
}

// =============================================================================
// OHLCV Data
// =============================================================================

export interface OHLCVBar {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVSeries {
  ticker: string;
  period: string;
  data: OHLCVBar[];
  orders: ChartOrder[]; // Orders within the period for chart overlay
}

export interface ChartOrder {
  date: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
}

// =============================================================================
// Stock Ideas (Parsed from Discord)
// =============================================================================

export type Direction = 'bullish' | 'bearish' | 'neutral' | 'mixed';

export type TradingLabel =
  | 'TRADE_EXECUTION'
  | 'TRADE_PLAN'
  | 'TECHNICAL_ANALYSIS'
  | 'FUNDAMENTAL_THESIS'
  | 'CATALYST_NEWS'
  | 'EARNINGS'
  | 'INSTITUTIONAL_FLOW'
  | 'OPTIONS'
  | 'RISK_MANAGEMENT'
  | 'SENTIMENT_CONVICTION'
  | 'PORTFOLIO_UPDATE'
  | 'QUESTION_REQUEST'
  | 'RESOURCE_LINK';

export interface PriceLevel {
  kind: 'entry' | 'target' | 'stop' | 'support' | 'resistance';
  value: number | null;
  qualifier: string | null;
}

export interface StockIdea {
  id: number;
  messageId: string;
  primarySymbol: string;
  symbols: string[];
  direction: Direction;
  action: string | null;
  confidence: number;
  labels: TradingLabel[];
  levels: PriceLevel[];
  ideaText: string;
  ideaSummary: string | null;
  author: string;
  sourceChannel: string;
  sourceCreatedAt: string; // ISO timestamp
  parsedAt: string; // ISO timestamp
}

export interface IdeasResponse {
  ticker: string;
  ideas: StockIdea[];
  total: number;
}

// =============================================================================
// Chat (OpenAI-powered stock analysis)
// =============================================================================

export interface ChatRequest {
  message: string;
  includeIdeas?: boolean; // Include recent parsed ideas in context
  includePosition?: boolean; // Include current position info
  maxIdeas?: number; // Max ideas to include (default: 10)
}

export interface ChatResponse {
  ticker: string;
  response: string;
  ideasUsed: number;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

// =============================================================================
// SnapTrade Webhook
// =============================================================================

export interface SnapTradeWebhookPayload {
  eventType: string;
  userId: string;
  accountId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

// =============================================================================
// API Response Wrappers
// =============================================================================

export interface ApiError {
  error: string;
  detail?: string;
  statusCode?: number; // Optional - may not always be present in error responses
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  database: boolean;
  rds: boolean;
  timestamp: string;
}
