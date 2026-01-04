// ═══════════════════════════════════════════════════════════════
// NEXUS V65.2 - Utility Functions
// ═══════════════════════════════════════════════════════════════

import { Asset, Dividend } from './types';

// ═══════════════════════════════════════════════════════════════
// KST TIMEZONE & MARKET STATE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * 서머타임(DST) 여부 확인
 * 미국 서머타임: 3월 둘째 일요일 02:00 ~ 11월 첫째 일요일 02:00
 */
export function isDST(date: Date = new Date()): boolean {
  const year = date.getFullYear();

  // 3월 둘째 일요일
  const marchSecondSunday = new Date(year, 2, 8);
  marchSecondSunday.setDate(marchSecondSunday.getDate() + (7 - marchSecondSunday.getDay()) % 7);

  // 11월 첫째 일요일
  const novFirstSunday = new Date(year, 10, 1);
  novFirstSunday.setDate(novFirstSunday.getDate() + (7 - novFirstSunday.getDay()) % 7);

  return date >= marchSecondSunday && date < novFirstSunday;
}

/**
 * UTC 시간을 KST로 변환
 */
export function utcToKST(utcDate: Date): Date {
  const kst = new Date(utcDate);
  kst.setHours(kst.getUTCHours() + 9);
  return kst;
}

/**
 * KST 시간을 UTC로 변환
 */
export function kstToUTC(kstDate: Date): Date {
  const utc = new Date(kstDate);
  utc.setHours(utc.getHours() - 9);
  return utc;
}

/**
 * 현재 KST 시간 가져오기
 */
export function getKSTNow(): Date {
  return utcToKST(new Date());
}

/**
 * KST 기준으로 포맷팅된 문자열 반환
 */
export function formatKST(date: Date, includeSeconds: boolean = true): string {
  const kst = utcToKST(date);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  const hours = String(kst.getHours()).padStart(2, '0');
  const minutes = String(kst.getMinutes()).padStart(2, '0');
  const seconds = String(kst.getSeconds()).padStart(2, '0');

  if (includeSeconds) {
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} KST`;
  }
  return `${year}-${month}-${day} ${hours}:${minutes} KST`;
}

/**
 * KST ISO 문자열 생성 (Supabase 저장용)
 */
export function toKSTISOString(date: Date = new Date()): string {
  const kst = utcToKST(date);
  return kst.toISOString();
}

/**
 * 미국 주식 시장 상태 계산 (KST 기준)
 */
export type MarketStateType = 'PRE' | 'REGULAR' | 'POST' | 'DAY' | 'CLOSED';

export function getMarketState(): MarketStateType {
  const now = new Date();
  const kstHour = now.getUTCHours() + 9;
  const kstHourNormalized = kstHour >= 24 ? kstHour - 24 : kstHour;
  const kstMinute = now.getUTCMinutes();
  const kstDay = now.getUTCDay();

  const isWeekend = kstDay === 0 || kstDay === 6;
  const dst = isDST(now);

  // 주말 한국 주간 거래 시간 (10:00~17:00 KST)
  if (isWeekend && kstHourNormalized >= 10 && kstHourNormalized < 17) {
    return 'DAY';
  }

  // 평일 미국 시장 시간 계산
  if (!isWeekend) {
    if (dst) {
      if ((kstHourNormalized === 17 && kstMinute >= 0) ||
          (kstHourNormalized > 17 && kstHourNormalized < 22) ||
          (kstHourNormalized === 22 && kstMinute < 30)) {
        return 'PRE';
      }
      if ((kstHourNormalized === 22 && kstMinute >= 30) ||
          kstHourNormalized === 23 ||
          kstHourNormalized < 5) {
        return 'REGULAR';
      }
      if (kstHourNormalized >= 5 && kstHourNormalized < 7) {
        return 'POST';
      }
    } else {
      if ((kstHourNormalized === 18 && kstMinute >= 0) ||
          (kstHourNormalized > 18 && kstHourNormalized < 23) ||
          (kstHourNormalized === 23 && kstMinute < 30)) {
        return 'PRE';
      }
      if ((kstHourNormalized === 23 && kstMinute >= 30) ||
          kstHourNormalized < 6) {
        return 'REGULAR';
      }
      if (kstHourNormalized >= 6 && kstHourNormalized < 8) {
        return 'POST';
      }
    }
  }

  return 'CLOSED';
}

/**
 * 시장 상태에 따른 표시 정보 반환
 */
export function getMarketStateInfo(state: MarketStateType) {
  const dst = isDST();

  const marketTimes = dst ? {
    pre: '17:00-22:30',
    regular: '22:30-05:00',
    post: '05:00-07:00',
    day: '10:00-17:00',
  } : {
    pre: '18:00-23:30',
    regular: '23:30-06:00',
    post: '06:00-08:00',
    day: '10:00-17:00',
  };

  const stateInfo = {
    PRE: { label: '🔵 프리마켓', time: marketTimes.pre, color: 'blue' },
    REGULAR: { label: '🟢 정규장', time: marketTimes.regular, color: 'green' },
    POST: { label: '🟣 애프터', time: marketTimes.post, color: 'purple' },
    DAY: { label: '🟠 주간거래', time: marketTimes.day, color: 'orange' },
    CLOSED: { label: '⚫ 휴장', time: '---', color: 'gray' },
  };

  return stateInfo[state] || stateInfo.CLOSED;
}

/**
 * Supabase timestamp 문자열을 KST Date로 변환
 */
export function parseSupabaseTimestamp(supabaseTimestamp: string): Date {
  const utcDate = new Date(supabaseTimestamp);
  return utcToKST(utcDate);
}

/**
 * 두 날짜 간의 시간 차이를 사람이 읽기 쉬운 형식으로 반환
 */
export function getTimeAgo(date1: Date, date2: Date = new Date()): string {
  const diff = date2.getTime() - date1.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return `${seconds}초 전`;
}

// ═══════════════════════════════════════════════════════════════
// FORMAT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function formatUSD(n: number, decimals: number = 2): string {
  return '$' + n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatKRW(n: number): string {
  return '₩' + Math.round(n).toLocaleString();
}

export function formatPercent(n: number, decimals: number = 2): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

export function formatNumber(n: number, decimals: number = 2): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  returnValue: number;
  returnPct: number;
  totalValueKRW: number;
  totalCostKRW: number;
  returnValueKRW: number;
}

export function calculatePortfolioStats(
  assets: Asset[],
  exchangeRate: number
): PortfolioStats {
  let totalValue = 0;
  let totalCost = 0;

  assets.forEach(a => {
    totalValue += a.qty * a.price;
    totalCost += a.qty * a.avg;
  });

  const returnValue = totalValue - totalCost;
  const returnPct = totalCost > 0 ? (returnValue / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    returnValue,
    returnPct,
    totalValueKRW: totalValue * exchangeRate,
    totalCostKRW: totalCost * exchangeRate,
    returnValueKRW: returnValue * exchangeRate,
  };
}

export interface AssetStats {
  cost: number;
  value: number;
  profit: number;
  returnPct: number;
  valueKRW: number;
  costKRW: number;
  profitKRW: number;
  fxPL: number;
  weight: number;
}

export function calculateAssetStats(
  asset: Asset,
  exchangeRate: number,
  totalValue: number
): AssetStats {
  const cost = asset.qty * asset.avg;
  const value = asset.qty * asset.price;
  const profit = value - cost;
  const returnPct = cost > 0 ? (profit / cost) * 100 : 0;
  const buyRate = asset.buyRate || exchangeRate;
  const valueKRW = value * exchangeRate;
  const costKRW = cost * buyRate;
  const profitKRW = valueKRW - costKRW;
  const fxPL = value * (exchangeRate - buyRate);
  const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

  return {
    cost,
    value,
    profit,
    returnPct,
    valueKRW,
    costKRW,
    profitKRW,
    fxPL,
    weight,
  };
}

// ═══════════════════════════════════════════════════════════════
// DIVIDEND CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface DividendStats {
  totalDividends: number;
  yearlyDividends: number;
  monthlyAverage: number;
  yieldOnCost: number;
}

export function calculateDividendStats(
  dividends: Dividend[],
  totalCost: number
): DividendStats {
  const now = new Date();
  const currentYear = now.getFullYear();

  const totalDividends = dividends.reduce((sum, d) => sum + d.qty * d.dps, 0);
  const yearlyDividends = dividends
    .filter(d => new Date(d.date).getFullYear() === currentYear)
    .reduce((sum, d) => sum + d.qty * d.dps, 0);

  const monthCount = new Set(
    dividends.map(d => d.date.substring(0, 7))
  ).size || 1;
  const monthlyAverage = totalDividends / monthCount;
  const yieldOnCost = totalCost > 0 ? (yearlyDividends / totalCost) * 100 : 0;

  return {
    totalDividends,
    yearlyDividends,
    monthlyAverage,
    yieldOnCost,
  };
}

// ═══════════════════════════════════════════════════════════════
// GROUPING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export interface GroupedAssets<T> {
  [key: string]: {
    assets: T[];
    totalValue: number;
    totalCost: number;
    returnPct: number;
  };
}

export function groupAssetsByType<T extends Asset>(
  assets: T[]
): GroupedAssets<T> {
  const groups: GroupedAssets<T> = {};

  assets.forEach((asset) => {
    const type = asset.type || 'CORE';
    if (!groups[type]) {
      groups[type] = { assets: [], totalValue: 0, totalCost: 0, returnPct: 0 };
    }
    groups[type].assets.push(asset);
    groups[type].totalValue += asset.qty * asset.price;
    groups[type].totalCost += asset.qty * asset.avg;
  });

  Object.values(groups).forEach(group => {
    group.returnPct = group.totalCost > 0
      ? ((group.totalValue - group.totalCost) / group.totalCost) * 100
      : 0;
  });

  return groups;
}

export function groupAssetsBySector<T extends Asset>(
  assets: T[]
): GroupedAssets<T> {
  const groups: GroupedAssets<T> = {};

  assets.forEach((asset) => {
    const sector = asset.sector || 'Other';
    if (!groups[sector]) {
      groups[sector] = { assets: [], totalValue: 0, totalCost: 0, returnPct: 0 };
    }
    groups[sector].assets.push(asset);
    groups[sector].totalValue += asset.qty * asset.price;
    groups[sector].totalCost += asset.qty * asset.avg;
  });

  Object.values(groups).forEach(group => {
    group.returnPct = group.totalCost > 0
      ? ((group.totalValue - group.totalCost) / group.totalCost) * 100
      : 0;
  });

  return groups;
}

// ═══════════════════════════════════════════════════════════════
// UI HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getReturnColorClass(returnPct: number): string {
  return returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger';
}

export function getReturnGlowClass(returnPct: number): string {
  return returnPct >= 0
    ? 'text-celestial-success glow-success'
    : 'text-celestial-danger glow-danger';
}

export function getPriceChangeIndicator(
  current: number,
  previous: number
): { isUp: boolean; pct: number } | null {
  if (!previous || previous === 0 || current === previous) return null;
  const diff = current - previous;
  const pct = (diff / previous) * 100;
  return { isUp: diff > 0, pct };
}

// ═══════════════════════════════════════════════════════════════
// DATE HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getDaysUntilNextDividend(dayOfWeek: number = 4): number {
  const now = new Date();
  const currentDay = now.getDay();
  return (dayOfWeek - currentDay + 7) % 7 || 7;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR');
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function isValidTicker(ticker: string): boolean {
  return /^[A-Z0-9]{1,10}$/.test(ticker.toUpperCase());
}

export function isValidGoogleScriptUrl(url: string): boolean {
  return url.startsWith('https://script.google.com/');
}

// ═══════════════════════════════════════════════════════════════
// SAFE PARSE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function safeNumber(value: string | number | null | undefined, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? fallback : num;
}
