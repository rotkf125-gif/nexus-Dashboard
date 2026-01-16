// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Configuration Constants
// ═══════════════════════════════════════════════════════════════

import { SectorInfo, VIXLevel, Asset, AssetType, TypeInfo } from './types';

// ═══════════════════════════════════════════════════════════════
// SECTOR CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const SECTORS: Record<string, SectorInfo> = {
  Technology:    { emoji: '🖥️', color: '#90CAF9', label: 'Tech' },
  Healthcare:    { emoji: '🏥', color: '#81C784', label: 'Health' },
  Finance:       { emoji: '🏦', color: '#FFD700', label: 'Finance' },
  Energy:        { emoji: '⚡', color: '#FFB74D', label: 'Energy' },
  Consumer:      { emoji: '🛒', color: '#F48FB1', label: 'Consumer' },
  Industrial:    { emoji: '🏭', color: '#B39DDB', label: 'Industrial' },
  RealEstate:    { emoji: '🏠', color: '#CE93D8', label: 'RE' },
  Utilities:     { emoji: '💡', color: '#80DEEA', label: 'Util' },
  Materials:     { emoji: '🧱', color: '#FFCC80', label: 'Materials' },
  Communication: { emoji: '📡', color: '#9FA8DA', label: 'Comm' },
  ETF:           { emoji: '📊', color: '#B39DDB', label: 'ETF' },
  Crypto:        { emoji: '₿', color: '#F7931A', label: 'Crypto' },
  Other:         { emoji: '📦', color: '#90A4AE', label: 'Other' },
};

export const SECTOR_LIST = Object.keys(SECTORS);

// ═══════════════════════════════════════════════════════════════
// ASSET TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const TYPE_ORDER: AssetType[] = ['CORE', 'GROWTH', 'VALUE', 'SPECULATIVE', 'INCOME'];

export const TYPE_COLORS: Record<AssetType, string> = {
  CORE: '#E0F7FA',
  INCOME: '#FFD700',
  GROWTH: '#81C784',
  VALUE: '#B39DDB',
  SPECULATIVE: '#E57373',
};

export const TYPE_INFO: Record<AssetType, TypeInfo> = {
  CORE: {
    label: 'CORE',
    icon: 'shield-alt',
    description: '핵심 보유 자산',
    color: '#E0F7FA'
  },
  INCOME: {
    label: 'INCOME',
    icon: 'coins',
    description: '배당/인컴 자산',
    color: '#FFD700'
  },
  GROWTH: {
    label: 'GROWTH',
    icon: 'rocket',
    description: '성장 투자 자산',
    color: '#81C784'
  },
  VALUE: {
    label: 'VALUE',
    icon: 'gem',
    description: '가치 투자 자산',
    color: '#B39DDB'
  },
  SPECULATIVE: {
    label: 'SPECULATIVE',
    icon: 'dice',
    description: '투기성 자산',
    color: '#E57373'
  },
};

// ═══════════════════════════════════════════════════════════════
// VIX LEVELS
// ═══════════════════════════════════════════════════════════════

export const VIX_LEVELS: Record<string, VIXLevel> = {
  LOW:     { max: 15, color: '#81C784', action: '정상 운용', label: 'LOW' },
  NORMAL:  { max: 25, color: '#FFD700', action: '모니터링 강화', label: 'NORMAL' },
  HIGH:    { max: 35, color: '#FFB74D', action: '방어적 포지션 권고', label: 'HIGH' },
  EXTREME: { max: 100, color: '#E57373', action: '긴급 리스크 점검', label: 'EXTREME' },
};

export function getVixLevel(vix: number): VIXLevel {
  if (vix <= VIX_LEVELS.LOW.max) return VIX_LEVELS.LOW;
  if (vix <= VIX_LEVELS.NORMAL.max) return VIX_LEVELS.NORMAL;
  if (vix <= VIX_LEVELS.HIGH.max) return VIX_LEVELS.HIGH;
  return VIX_LEVELS.EXTREME;
}

// ═══════════════════════════════════════════════════════════════
// CHART COLORS
// ═══════════════════════════════════════════════════════════════

export const CHART_COLORS = [
  '#90CAF9', '#FFD700', '#B39DDB', '#81C784', '#F48FB1',
  '#FFB74D', '#80DEEA', '#A5D6A7', '#90A4AE', '#CE93D8',
] as const;

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_EXCHANGE_RATE = 1450;

export const DEFAULT_ASSETS: Asset[] = [
  { ticker: 'PLTY', qty: 100, avg: 27.00, price: 0, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
  { ticker: 'HOOY', qty: 100, avg: 34.00, price: 0, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
];

// ═══════════════════════════════════════════════════════════════
// BENCHMARK CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const BENCHMARK_TICKERS = [
  { ticker: 'SPY', name: 'S&P 500', color: '#90CAF9' },
  { ticker: 'QQQ', name: 'NASDAQ 100', color: '#81C784' },
  { ticker: 'DIA', name: 'Dow Jones', color: '#FFD700' },
  { ticker: 'VTI', name: 'Total Market', color: '#B39DDB' },
  { ticker: 'SCHD', name: 'Dividend', color: '#F48FB1' },
] as const;

// ═══════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const API_ENDPOINTS = {
  MARKET: '/api/market',
  PRICE: (ticker: string) => `/api/price/${ticker}`,
  BENCHMARK: '/api/benchmark',
} as const;

export const REFRESH_INTERVALS = {
  PRICE: 60000,      // 1 minute
  MARKET: 30000,     // 30 seconds
  SNAPSHOT: 1800000, // 30 minutes
} as const;

// ═══════════════════════════════════════════════════════════════
// TAX CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const TAX_CONFIG = {
  AFTER_TAX_RATE: 0.85,      // 세후 배당 비율 (15% 원천징수)
  DIVIDEND_TAX_RATE: 0.15,   // 배당 세율
} as const;

// ═══════════════════════════════════════════════════════════════
// UI CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const UI_CONFIG = {
  TOAST_DURATION: 3000,      // 토스트 표시 시간 (ms)
  DEBOUNCE_DELAY: 1000,      // 저장 디바운스 (ms)
  MAX_HISTORY: 10,           // Undo/Redo 히스토리 최대 개수
} as const;