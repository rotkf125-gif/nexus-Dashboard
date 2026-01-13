// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Type Definitions
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════

export type AssetType = 'CORE' | 'INCOME' | 'GROWTH' | 'VALUE' | 'SPECULATIVE';
export type ThemeType = 'dark' | 'light';
export type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'CLOSED' | 'DAY';

export interface Asset {
  ticker: string;
  qty: number;
  avg: number;
  price: number;
  type: AssetType;
  sector: string;
  buyRate: number;
}

export interface AssetWithIndex extends Asset {
  originalIndex: number;
}

export interface Dividend {
  date: string;
  ticker: string;
  qty: number;
  dps: number;
}

export interface TimelineEntry {
  date: string;
  cost: number;
  value: number;
}

export interface MarketData {
  nasdaq: number;
  sp500: number;
  vix: number;
  tnx: number;
  krw: number;
  marketState?: MarketState;
}

export interface TradeSums {
  [ticker: string]: number;
}

export interface NexusState {
  assets: Asset[];
  dividends: Dividend[];
  timeline: TimelineEntry[];
  exchangeRate: number;
  tradeSums: TradeSums;
  scriptUrl: string;
  strategy: string;
  theme: ThemeType;
  market: MarketData;
  previousMarket: MarketData;
  previousPrices: Record<string, number>;
  lastSync: number | null;
  compactMode: boolean;
  vixAlertDismissed: boolean;
  isFetching: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG TYPES
// ═══════════════════════════════════════════════════════════════

export interface SectorInfo {
  emoji: string;
  color: string;
  label: string;
}

export interface VIXLevel {
  max: number;
  color: string;
  action: string;
  label: string;
}

export interface TypeInfo {
  label: string;
  icon: string;
  description: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface PriceResponse {
  ticker: string;
  price: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

export interface MarketResponse extends MarketData {
  timestamp: number;
}

export interface BenchmarkData {
  name: string;
  ticker: string;
  ytdReturn: number;
  currentPrice: number;
  yearStartPrice: number;
  color: string;
}

export interface BenchmarkResponse {
  benchmarks: BenchmarkData[];
  timestamp: number;
}

export interface SheetSyncResponse {
  dividends: Dividend[];
  tradeSums?: TradeSums;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROP TYPES
// ═══════════════════════════════════════════════════════════════

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AssetModalProps extends ModalProps {
  onSave: (asset: Asset) => void;
  editingAsset: Asset | null;
  editingIndex: number | null;
  exchangeRate: number;
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface WhatIfScenario {
  ticker: string;
  priceChange: number;
  qtyChange: number;
}

export interface RebalanceTarget {
  ticker: string;
  currentWeight: number;
  targetWeight: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
}

export interface CorrelationData {
  ticker1: string;
  ticker2: string;
  correlation: number;
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT TYPES
// ═══════════════════════════════════════════════════════════════

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  timestamp: string;
  total_value: number;
  total_cost: number;
  return_pct: number;
  exchange_rate: number;
  assets: Asset[];
  market: MarketData;
}

// ═══════════════════════════════════════════════════════════════
// HISTORIC PERFORMANCE TYPES
// ═══════════════════════════════════════════════════════════════

export type HistoricPeriod = '24h' | '1w' | '1m';

export interface HistoricDataPoint {
  timestamp: string;
  totalValue: number;
  totalCost: number;
  returnPct: number;
}

// ═══════════════════════════════════════════════════════════════
// RISK ANALYTICS TYPES
// ═══════════════════════════════════════════════════════════════

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface RiskMetrics {
  overallScore: number;
  diversificationScore: number;
  sectorConcentration: number;
  volatilityScore: number;
  concentrationRisk: number;
}

// ═══════════════════════════════════════════════════════════════
// WIDGET API TYPES
// ═══════════════════════════════════════════════════════════════

export interface WidgetHolding {
  ticker: string;
  value: number;
  returnPct: number;
}

export interface WidgetData {
  timestamp: number;
  totalValue: number;
  totalValueKRW: number;
  todayReturn: number;
  todayReturnPct: number;
  topHoldings: WidgetHolding[];
  marketState: string;
  exchangeRate: number;
}
