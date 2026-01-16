'use client';

// ═══════════════════════════════════════════════════════════════
// useDividendStats - 배당 통계 계산 훅
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useNexus } from '../context';
import { TAX_CONFIG } from '../config';

export interface DividendStats {
  totalDividends: number;
  totalDividendsKRW: number;
  dividendCount: number;
  // 월별 배당
  monthlyDividends: Record<string, number>;
  // 티커별 배당
  tickerDividends: Record<string, { total: number; count: number; avgDps: number }>;
  // 최근 N개월 배당
  recentDividends: (months: number) => number;
  // 연간 예상 배당
  projectedAnnualDividend: number;
  // 상위 배당 종목
  topDividendTickers: Array<{ ticker: string; total: number; count: number; avgDps: number }>;
}

export function useDividendStats(): DividendStats {
  const { state } = useNexus();
  const { dividends, exchangeRate } = state;

  return useMemo(() => {
    const { AFTER_TAX_RATE } = TAX_CONFIG;

    // 총 배당금 (세후)
    const totalDividends = dividends.reduce(
      (sum, d) => sum + d.qty * d.dps * AFTER_TAX_RATE,
      0
    );
    const totalDividendsKRW = totalDividends * exchangeRate;

    // 월별 배당
    const monthlyDividends: Record<string, number> = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7); // YYYY-MM
      const amount = d.qty * d.dps * AFTER_TAX_RATE;
      monthlyDividends[month] = (monthlyDividends[month] || 0) + amount;
    });

    // 티커별 배당
    const tickerDividends: Record<string, { total: number; count: number; avgDps: number }> = {};
    dividends.forEach(d => {
      const amount = d.qty * d.dps * AFTER_TAX_RATE;
      if (!tickerDividends[d.ticker]) {
        tickerDividends[d.ticker] = { total: 0, count: 0, avgDps: 0 };
      }
      tickerDividends[d.ticker].total += amount;
      tickerDividends[d.ticker].count += 1;
    });
    // 평균 DPS 계산
    Object.keys(tickerDividends).forEach(ticker => {
      const tickerDivs = dividends.filter(d => d.ticker === ticker);
      if (tickerDivs.length > 0) {
        tickerDividends[ticker].avgDps = 
          tickerDivs.reduce((sum, d) => sum + d.dps, 0) / tickerDivs.length;
      }
    });

    // 최근 N개월 배당 계산 함수
    const recentDividends = (months: number): number => {
      const now = new Date();
      const cutoff = new Date(now.getFullYear(), now.getMonth() - months, 1);
      
      return dividends
        .filter(d => new Date(d.date) >= cutoff)
        .reduce((sum, d) => sum + d.qty * d.dps * AFTER_TAX_RATE, 0);
    };

    // 연간 예상 배당 (최근 3개월 평균 * 4)
    const recent3m = recentDividends(3);
    const projectedAnnualDividend = (recent3m / 3) * 12;

    // 상위 배당 종목
    const topDividendTickers = Object.entries(tickerDividends)
      .map(([ticker, data]) => ({ ticker, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalDividends,
      totalDividendsKRW,
      dividendCount: dividends.length,
      monthlyDividends,
      tickerDividends,
      recentDividends,
      projectedAnnualDividend,
      topDividendTickers,
    };
  }, [dividends, exchangeRate]);
}
