// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - Type Definitions
// ═══════════════════════════════════════════════════════════════

export interface Asset {
  ticker: string;
  qty: number;
  avg: number;
  price: number;
  type: 'CORE' | 'INCOME' | 'GROWTH' | 'VALUE' | 'SPECULATIVE';
  sector: string;
  buyRate: number;
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
  theme: 'dark' | 'light';
  market: MarketData;
  previousMarket: MarketData;
  previousPrices: { [ticker: string]: number };
  lastSync: number | null;
  compactMode: boolean;
  vixAlertDismissed: boolean;
  isLive: boolean;
  isFetching: boolean;
}

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
