// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - Configuration Constants
// ═══════════════════════════════════════════════════════════════

import { SectorInfo, VIXLevel, Asset } from './types';

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

export const VIX_LEVELS: Record<string, VIXLevel> = {
  LOW:     { max: 15, color: '#81C784', action: '정상 운용', label: 'LOW' },
  NORMAL:  { max: 25, color: '#FFD700', action: '모니터링 강화', label: 'NORMAL' },
  HIGH:    { max: 35, color: '#FFB74D', action: '방어적 포지션 권고', label: 'HIGH' },
  EXTREME: { max: 100, color: '#E57373', action: '긴급 리스크 점검', label: 'EXTREME' },
};

export const TYPE_COLORS: Record<string, string> = {
  CORE: '#E0F7FA',
  INCOME: '#FFD700',
  GROWTH: '#81C784',
  VALUE: '#B39DDB',
  SPECULATIVE: '#E57373',
};

export const CHART_COLORS = [
  '#90CAF9', '#FFD700', '#B39DDB', '#81C784', '#F48FB1',
  '#FFB74D', '#80DEEA', '#A5D6A7', '#90A4AE', '#CE93D8',
];

export const DEFAULT_ASSETS: Asset[] = [
  { ticker: 'PLTY', qty: 100, avg: 27.00, price: 0, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
  { ticker: 'HOOY', qty: 100, avg: 34.00, price: 0, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
];

export const DEFAULT_EXCHANGE_RATE = 1450;
