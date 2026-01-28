'use client';

// ═══════════════════════════════════════════════════════════════
// usePortfolioStats - 포트폴리오 통계 계산 훅
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { useNexus } from '../context';
import { Asset } from '../types';

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  profit: number;
  returnPct: number;
  totalValueKRW: number;
  totalCostKRW: number;
  profitKRW: number;
  assetCount: number;
  avgBuyRate: number; // 평균 매수환율
  // 유형별 통계
  typeDistribution: Record<string, { count: number; value: number; weight: number }>;
  // 섹터별 통계
  sectorDistribution: Record<string, { count: number; value: number; weight: number }>;
  // 상위 종목
  topHoldings: Array<{
    ticker: string;
    value: number;
    weight: number;
    profit: number;
    returnPct: number;
  }>;
  // 수익률 상위 종목
  topPerformers: Array<{
    ticker: string;
    value: number;
    returnPct: number;
  }>;
}

export function usePortfolioStats(): PortfolioStats {
  const { state } = useNexus();
  const { assets, exchangeRate } = state;

  return useMemo(() => {
    // 동일 티커 병합
    const tickerMap: Record<string, Asset & { totalQty: number; totalCost: number; totalValue: number }> = {};
    assets.forEach(a => {
      const value = a.qty * a.price;
      const cost = a.qty * a.avg;
      if (!tickerMap[a.ticker]) {
        tickerMap[a.ticker] = { ...a, totalQty: 0, totalCost: 0, totalValue: 0 };
      }
      tickerMap[a.ticker].totalQty += a.qty;
      tickerMap[a.ticker].totalCost += cost;
      tickerMap[a.ticker].totalValue += value;
    });

    const mergedAssets = Object.values(tickerMap);

    // 기본 계산 (병합된 자산 기준)
    const totalValue = mergedAssets.reduce((sum, a) => sum + a.totalValue, 0);
    const totalCost = mergedAssets.reduce((sum, a) => sum + a.totalCost, 0);
    const profit = totalValue - totalCost;
    const returnPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    // KRW 변환
    const totalValueKRW = totalValue * exchangeRate;
    const totalCostKRW = totalCost * exchangeRate;
    const profitKRW = profit * exchangeRate;

    // 유형별 분포 (병합된 자산 기준)
    const typeDistribution: Record<string, { count: number; value: number; weight: number }> = {};
    mergedAssets.forEach(a => {
      if (!typeDistribution[a.type]) {
        typeDistribution[a.type] = { count: 0, value: 0, weight: 0 };
      }
      typeDistribution[a.type].count += 1;
      typeDistribution[a.type].value += a.totalValue;
    });
    // 가중치 계산
    Object.keys(typeDistribution).forEach(type => {
      typeDistribution[type].weight = totalValue > 0
        ? (typeDistribution[type].value / totalValue) * 100
        : 0;
    });

    // 섹터별 분포 (병합된 자산 기준)
    const sectorDistribution: Record<string, { count: number; value: number; weight: number }> = {};
    mergedAssets.forEach(a => {
      if (!sectorDistribution[a.sector]) {
        sectorDistribution[a.sector] = { count: 0, value: 0, weight: 0 };
      }
      sectorDistribution[a.sector].count += 1;
      sectorDistribution[a.sector].value += a.totalValue;
    });
    Object.keys(sectorDistribution).forEach(sector => {
      sectorDistribution[sector].weight = totalValue > 0
        ? (sectorDistribution[sector].value / totalValue) * 100
        : 0;
    });

    // 상위 종목 (비중 기준)
    const topHoldings = mergedAssets
      .map(data => ({
        ticker: data.ticker,
        value: data.totalValue,
        weight: totalValue > 0 ? (data.totalValue / totalValue) * 100 : 0,
        profit: data.totalValue - data.totalCost,
        returnPct: data.totalCost > 0 ? ((data.totalValue - data.totalCost) / data.totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // 수익률 상위 종목
    const topPerformers = mergedAssets
      .map(data => ({
        ticker: data.ticker,
        value: data.totalValue,
        returnPct: data.totalCost > 0 ? ((data.totalValue - data.totalCost) / data.totalCost) * 100 : 0,
      }))
      .sort((a, b) => b.returnPct - a.returnPct)
      .slice(0, 3);

    // 평균 매수환율 계산 (원금 가중평균)
    let avgBuyRate = 0;
    if (totalCost > 0) {
      let weightedRateSum = 0;
      assets.forEach(a => {
        const cost = a.qty * a.avg;
        const buyRate = a.buyRate || exchangeRate;
        weightedRateSum += cost * buyRate;
      });
      avgBuyRate = weightedRateSum / totalCost;
    }

    return {
      totalValue,
      totalCost,
      profit,
      returnPct,
      totalValueKRW,
      totalCostKRW,
      profitKRW,
      assetCount: mergedAssets.length,  // 병합된 종목 수
      avgBuyRate,
      typeDistribution,
      sectorDistribution,
      topHoldings,
      topPerformers,
    };
  }, [assets, exchangeRate]);
}
