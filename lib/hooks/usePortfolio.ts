// ═══════════════════════════════════════════════════════════════
// NEXUS V1.7 - Portfolio Calculation Hook
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { Asset, Dividend } from '../types';
import {
  calculatePortfolioStats,
  calculateAssetStats,
  calculateDividendStats,
  groupAssetsByType,
  groupAssetsBySector,
  PortfolioStats,
  AssetStats,
  DividendStats,
  GroupedAssets,
} from '../utils';

interface UsePortfolioOptions {
  assets: Asset[];
  dividends: Dividend[];
  exchangeRate: number;
}

interface UsePortfolioReturn {
  stats: PortfolioStats;
  dividendStats: DividendStats;
  byType: GroupedAssets<Asset>;
  bySector: GroupedAssets<Asset>;
  getAssetStats: (asset: Asset) => AssetStats;
  topPerformers: Asset[];
  worstPerformers: Asset[];
  incomeAssets: Asset[];
  assetCount: number;
}

export function usePortfolio({
  assets,
  dividends,
  exchangeRate,
}: UsePortfolioOptions): UsePortfolioReturn {
  // Portfolio stats (memoized)
  const stats = useMemo(
    () => calculatePortfolioStats(assets, exchangeRate),
    [assets, exchangeRate]
  );

  // Dividend stats (memoized)
  const dividendStats = useMemo(
    () => calculateDividendStats(dividends, stats.totalCost),
    [dividends, stats.totalCost]
  );

  // Grouped by type (memoized)
  const byType = useMemo(() => groupAssetsByType(assets), [assets]);

  // Grouped by sector (memoized)
  const bySector = useMemo(() => groupAssetsBySector(assets), [assets]);

  // Get individual asset stats
  const getAssetStats = useMemo(
    () => (asset: Asset) => calculateAssetStats(asset, exchangeRate, stats.totalValue),
    [exchangeRate, stats.totalValue]
  );

  // Top performers (by return %)
  const topPerformers = useMemo(() => {
    return [...assets]
      .map(asset => ({
        ...asset,
        returnPct: asset.avg > 0 ? ((asset.price - asset.avg) / asset.avg) * 100 : 0,
      }))
      .sort((a, b) => b.returnPct - a.returnPct)
      .slice(0, 5);
  }, [assets]);

  // Worst performers (by return %)
  const worstPerformers = useMemo(() => {
    return [...assets]
      .map(asset => ({
        ...asset,
        returnPct: asset.avg > 0 ? ((asset.price - asset.avg) / asset.avg) * 100 : 0,
      }))
      .sort((a, b) => a.returnPct - b.returnPct)
      .slice(0, 5);
  }, [assets]);

  // Income assets
  const incomeAssets = useMemo(
    () => assets.filter(a => a.type === 'INCOME'),
    [assets]
  );

  return {
    stats,
    dividendStats,
    byType,
    bySector,
    getAssetStats,
    topPerformers,
    worstPerformers,
    incomeAssets,
    assetCount: assets.length,
  };
}
