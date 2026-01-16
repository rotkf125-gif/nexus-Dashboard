'use client';

// ═══════════════════════════════════════════════════════════════
// useTradeStats - 거래 통계 계산 훅
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useNexus } from '../context';

export interface TradeStats {
  totalRealized: number;
  totalRealizedKRW: number;
  tickerCount: number;
  // 수익/손실 분류
  profitCount: number;
  lossCount: number;
  totalProfit: number;
  totalLoss: number;
  // 상위 종목
  topGainers: Array<{ ticker: string; pnl: number }>;
  topLosers: Array<{ ticker: string; pnl: number }>;
  // 승률
  winRate: number;
}

export function useTradeStats(): TradeStats {
  const { state } = useNexus();
  const { tradeSums, exchangeRate } = state;

  return useMemo(() => {
    const entries = Object.entries(tradeSums);

    // 총 실현 손익
    const totalRealized = entries.reduce((sum, [, val]) => sum + (val || 0), 0);
    const totalRealizedKRW = totalRealized * exchangeRate;

    // 수익/손실 분류
    const profits = entries.filter(([, pnl]) => pnl > 0);
    const losses = entries.filter(([, pnl]) => pnl < 0);

    const profitCount = profits.length;
    const lossCount = losses.length;
    const totalProfit = profits.reduce((sum, [, pnl]) => sum + pnl, 0);
    const totalLoss = losses.reduce((sum, [, pnl]) => sum + pnl, 0);

    // 상위 수익 종목
    const topGainers = profits
      .map(([ticker, pnl]) => ({ ticker, pnl }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 5);

    // 상위 손실 종목
    const topLosers = losses
      .map(([ticker, pnl]) => ({ ticker, pnl }))
      .sort((a, b) => a.pnl - b.pnl)
      .slice(0, 5);

    // 승률
    const totalTrades = profitCount + lossCount;
    const winRate = totalTrades > 0 ? (profitCount / totalTrades) * 100 : 0;

    return {
      totalRealized,
      totalRealizedKRW,
      tickerCount: entries.length,
      profitCount,
      lossCount,
      totalProfit,
      totalLoss,
      topGainers,
      topLosers,
      winRate,
    };
  }, [tradeSums, exchangeRate]);
}
