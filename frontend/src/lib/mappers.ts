/**
 * Mapping layer: Backend API types → UI-friendly display types.
 *
 * Single source of truth for all field renaming between the FastAPI
 * backend response shapes (types/api.ts) and the display models
 * consumed by standalone pages.
 *
 * Dashboard components (PositionsTable, RecentOrders, etc.) use the
 * api.ts types directly and do NOT need these mappers.
 */

import type {
  Position as ApiPosition,
  Order as ApiOrder,
  StockProfileCurrent,
} from '@/types/api';

// ---------------------------------------------------------------------------
// UI display types (used by standalone pages)
// ---------------------------------------------------------------------------

/**
 * Position display model used by /positions page.
 * Field names are human-friendly (averageCost, marketValue, etc.).
 */
export interface UiPosition {
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

/**
 * Order display model used by /orders page.
 * Normalises casing and field names.
 */
export interface UiOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  status: 'filled' | 'pending' | 'cancelled' | 'rejected' | 'expired';
  quantity: number;
  filledQuantity: number;
  price: number | null;
  limitPrice: number | null;
  stopPrice: number | null;
  createdAt: string;
  filledAt: string | null;
  totalValue: number | null;
}

/**
 * Position sub-model derived from StockProfileCurrent,
 * used by PositionCard on the stock detail page.
 */
export interface UiStockPosition {
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

// ---------------------------------------------------------------------------
// Mapper functions
// ---------------------------------------------------------------------------

/**
 * Map a backend Position to the UI display model.
 *
 * Renames:
 *   averageBuyPrice → averageCost
 *   equity          → marketValue
 *   openPnl         → unrealizedPL
 *   openPnlPercent  → unrealizedPLPercent
 *
 * Computes:
 *   totalCost = quantity × averageCost
 *
 * Defaults:
 *   companyName = "" (backend doesn't provide it yet)
 *   sector      = "" (backend doesn't provide it yet)
 */
export function toUiPosition(api: ApiPosition): UiPosition {
  const averageCost = api.averageBuyPrice ?? 0;
  const quantity = api.quantity ?? 0;

  return {
    symbol: api.symbol,
    companyName: '',
    quantity,
    averageCost,
    currentPrice: api.currentPrice ?? 0,
    marketValue: api.equity ?? 0,
    totalCost: quantity * averageCost,
    unrealizedPL: api.openPnl ?? 0,
    unrealizedPLPercent: api.openPnlPercent ?? 0,
    dayChange: api.dayChange ?? 0,
    dayChangePercent: api.dayChangePercent ?? 0,
    sector: '',
  };
}

/**
 * Map a backend Order to the UI display model.
 *
 * Renames:
 *   brokerageOrderId → id
 *   action           → side (lower-cased)
 *   totalQuantity    → quantity
 *   executionPrice   → price
 *   timePlaced       → createdAt
 *   timeExecuted     → filledAt
 *
 * Computes:
 *   filledQuantity (not in API — default 0, but quantity for filled)
 *   totalValue = quantity × price
 *
 * Normalises:
 *   status to lowercase with 'canceled' → 'cancelled'
 */
export function toUiOrder(api: ApiOrder): UiOrder {
  const statusMap: Record<string, UiOrder['status']> = {
    executed: 'filled',
    filled: 'filled',
    pending: 'pending',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    rejected: 'rejected',
    expired: 'expired',
  };
  const rawStatus = (api.status ?? '').toLowerCase();
  const status = statusMap[rawStatus] ?? 'pending';

  const side: 'buy' | 'sell' = (api.action ?? '').toUpperCase() === 'SELL' ? 'sell' : 'buy';

  const price = api.executionPrice ?? api.limitPrice ?? null;
  const quantity = api.totalQuantity ?? 0;
  const totalValue = price != null && price > 0 ? quantity * price : null;

  return {
    id: api.brokerageOrderId,
    symbol: api.symbol,
    side,
    type: api.orderType ?? 'market',
    status,
    quantity,
    filledQuantity: status === 'filled' ? quantity : 0,
    price,
    limitPrice: api.limitPrice ?? null,
    stopPrice: api.stopPrice ?? null,
    createdAt: api.timePlaced ?? '',
    filledAt: api.timeExecuted ?? null,
    totalValue,
  };
}

/**
 * Extract a position sub-model from the flat StockProfileCurrent shape.
 *
 * Returns null if the profile has no position (qty ≤ 0 or null).
 */
export function toUiStockPosition(
  api: StockProfileCurrent,
): UiStockPosition | null {
  const qty = api.currentPositionQty;
  if (qty == null || qty <= 0) return null;

  const latest = api.latestClosePrice ?? 0;
  const prev = api.previousClosePrice ?? latest;
  const dayChange = prev > 0 ? (latest - prev) * qty : 0;
  const dayChangePct = prev > 0 ? ((latest - prev) / prev) * 100 : 0;

  return {
    quantity: qty,
    averageCost: api.avgBuyPrice ?? 0,
    currentPrice: latest,
    marketValue: api.currentPositionValue ?? qty * latest,
    unrealizedPL: api.unrealizedPnl ?? 0,
    unrealizedPLPercent: api.unrealizedPnlPct ?? 0,
    dayChange: Math.round(dayChange * 100) / 100,
    dayChangePercent: Math.round(dayChangePct * 100) / 100,
  };
}
