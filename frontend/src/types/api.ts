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
  totalEquity: number; // Equity-only (positions market value, no cash)
  totalCost: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  cashBalance: number;
  positionsCount: number;
  lastSync: string; // ISO timestamp (SnapTrade last sync)
  source: string; // Data source: 'snaptrade' | 'cache'
  buyingPower?: number; // From account_balances.buying_power
  assetBreakdown?: Record<string, number>; // {assetType: totalEquity}
  cryptoValue?: number; // Total crypto equity
  cryptoPnl?: number; // Total crypto unrealized P/L
  connectionStatus?: 'connected' | 'disconnected' | 'error' | 'deleted';
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
  // Robinhood-style fields (optional)
  portfolioDiversity?: number; // equity / totalEquity * 100
  companyName?: string;
  assetType?: string; // 'equity' | 'etf' | 'crypto' | 'option'
  tvSymbol?: string; // TradingView widget symbol (e.g. "COINBASE:BTCUSD", "NASDAQ:AAPL")
}

// Recon mode debug metadata (only present when ?recon=1)
export interface ReconPositionMeta {
  symbol: string;
  priceSource: 'databento' | 'snaptrade' | 'yfinance' | 'avgcost';
  priceUsed: number;
  databentoPrice: number | null;
  snaptradePrice: number | null;
  yfinancePrice: number | null;
  prevCloseSource: string | null;
  prevCloseValue: number | null;
}

export interface ReconMeta {
  positions: ReconPositionMeta[];
  cashRaw: number;
  cashForTotal: number;
  totalEquityComputed: number;
  totalCostComputed: number;
  priceSourceBreakdown: Record<string, number>;
}

export interface PortfolioResponse {
  summary: PortfolioSummary;
  positions: Position[];
  recon?: ReconMeta; // Only populated when ?recon=1
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

  // Company metadata (from yfinance)
  companyName?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
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
  context?: string; // Additional context for the AI
}

export interface ChatResponse {
  response: string;
  sources: string[]; // Data sources used (e.g. "OHLCV data", "Discord trading ideas")
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

// =============================================================================
// OpenBB Insights (Fundamentals, Transcripts, Management, Filings, News, Notes)
// =============================================================================

export interface TranscriptItem {
  date: string | null;
  content: string;
  quarter: number | null;
  year: number | null;
  symbol: string;
}

export interface TranscriptResponse {
  ticker: string;
  transcripts: TranscriptItem[];
}

export interface ExecutiveItem {
  name: string;
  title: string;
  pay: number | null;
  currency: string | null;
  gender: string | null;
  yearBorn: number | null;
  titleSince: string | null;
}

export interface ManagementResponse {
  ticker: string;
  executives: ExecutiveItem[];
}

export interface FundamentalsResponse {
  ticker: string;
  marketCap: number | null;
  peRatio: number | null;
  pegRatio: number | null;
  epsActual: number | null;
  revenuePerShare: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  dividendYield: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  bookValuePerShare: number | null;
  freeCashFlowPerShare: number | null;
}

export interface FilingItem {
  filingDate: string | null;
  formType: string;
  reportUrl: string | null;
  description: string | null;
  acceptedDate: string | null;
}

export interface FilingsResponse {
  ticker: string;
  filings: FilingItem[];
  total: number;
}

export interface NewsItem {
  date: string | null;
  title: string;
  text: string | null;
  url: string | null;
  source: string | null;
  images: string[];
}

export interface NewsResponse {
  ticker: string;
  articles: NewsItem[];
  total: number;
}

export interface StockNote {
  id: number;
  symbol: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesResponse {
  ticker: string;
  notes: StockNote[];
  total: number;
}

// =============================================================================
// Activities (SnapTrade trade history)
// =============================================================================

export interface Activity {
  id: string;
  accountId: string | null;
  activityType: string | null; // BUY, SELL, DIVIDEND, FEE
  tradeDate: string | null;
  settlementDate: string | null;
  amount: number;
  price: number | null;
  units: number | null;
  symbol: string | null;
  description: string | null;
  currency: string;
  fee: number;
  fxRate: number | null;
  institution: string | null;
  optionType: string | null;
}

export interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  startDate: string;
  endDate: string;
}

// =============================================================================
// Brokerage Connections (SnapTrade)
// =============================================================================

export interface ConnectionInfo {
  accountId: string;
  name: string | null;
  institutionName: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'deleted';
  disabledAt: string | null;
  errorMessage: string | null;
  lastSync: string | null;
}

export interface ConnectionsResponse {
  connections: ConnectionInfo[];
}

// =============================================================================
// Sparklines (batch close prices for portfolio sparklines)
// =============================================================================

export interface SparklineData {
  symbol: string;
  closes: number[];
  dates: string[];
}

export interface SparklineResponse {
  sparklines: SparklineData[];
  period: string;
}
