import { useMemo } from 'react';
import { Asset, MarketData, RiskMetrics, RiskLevel } from '../types';
import { ETF_SECTOR_DATA, SECTOR_CORRELATIONS } from '../market-data';

function calculateRiskMetrics(
  diversificationScore: number,
  topSectorWeight: number,
  vix: number,
  maxAssetWeight: number
): RiskMetrics {
  const volatilityScore = Math.max(0, Math.min(100, 100 - (vix - 12) * 3.5));
  const sectorConcentration = Math.max(0, Math.min(100, 100 - (topSectorWeight * 100)));
  const concentrationRisk = Math.max(0, Math.min(100, 100 - (maxAssetWeight * 100 * 1.5)));
  const overallScore = Math.round(
    diversificationScore * 0.25 +
    sectorConcentration * 0.20 +
    volatilityScore * 0.25 +
    concentrationRisk * 0.30
  );
  return {
    overallScore,
    diversificationScore: Math.round(diversificationScore),
    sectorConcentration: Math.round(sectorConcentration),
    volatilityScore: Math.round(volatilityScore),
    concentrationRisk: Math.round(concentrationRisk),
  };
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'LOW';
  if (score >= 50) return 'MODERATE';
  if (score >= 30) return 'HIGH';
  return 'EXTREME';
}

export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    LOW: '#81C784',
    MODERATE: '#FFD700',
    HIGH: '#FFB74D',
    EXTREME: '#E57373',
  };
  return colors[level];
}

export function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: 'LOW RISK',
    MODERATE: 'MODERATE RISK',
    HIGH: 'HIGH RISK',
    EXTREME: 'EXTREME RISK',
  };
  return labels[level];
}

export function useRiskAnalytics(assets: Asset[], market: MarketData) {
  // 같은 티커를 하나로 통합
  const mergedAssets = useMemo(() => {
    const merged: Record<string, Asset & { totalValue: number; totalCost: number }> = {};

    assets.forEach(asset => {
      if (!merged[asset.ticker]) {
        merged[asset.ticker] = {
          ...asset,
          totalValue: asset.qty * asset.price,
          totalCost: asset.qty * asset.avg,
        };
      } else {
        // 같은 티커가 있으면 수량과 총 가치를 합산
        merged[asset.ticker].qty += asset.qty;
        merged[asset.ticker].totalValue += asset.qty * asset.price;
        merged[asset.ticker].totalCost += asset.qty * asset.avg;
        // 평균 가격 재계산
        merged[asset.ticker].price = merged[asset.ticker].totalValue / merged[asset.ticker].qty;
        merged[asset.ticker].avg = merged[asset.ticker].totalCost / merged[asset.ticker].qty;
      }
    });

    return Object.values(merged);
  }, [assets]);

  // 포트폴리오 섹터 분산도 계산
  const portfolioSectorWeights = useMemo(() => {
    const totalValue = mergedAssets.reduce((sum, a) => sum + a.totalValue, 0);
    if (totalValue === 0) return {};
    const sectorWeights: Record<string, number> = {};
    mergedAssets.forEach(asset => {
      const assetWeight = asset.totalValue / totalValue;
      const etfSectors = ETF_SECTOR_DATA[asset.ticker];
      if (etfSectors) {
        Object.entries(etfSectors).forEach(([sector, weight]) => {
          sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight * weight;
        });
      } else {
        const sector = asset.sector || 'Other';
        sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight;
      }
    });
    return sectorWeights;
  }, [mergedAssets]);

  const topSectors = useMemo(() => {
    return Object.entries(portfolioSectorWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [portfolioSectorWeights]);

  const diversificationScore = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    if (weights.length === 0) return 0;
    const hhi = weights.reduce((sum, w) => sum + w * w, 0);
    const minHHI = 1 / Math.max(weights.length, 1);
    return Math.max(0, 100 - ((hhi - minHHI) / (1 - minHHI)) * 100);
  }, [portfolioSectorWeights]);

  const marketCorrelations = useMemo(() => {
    const spySectors = ETF_SECTOR_DATA['SPY'] || {};
    const qqqSectors = ETF_SECTOR_DATA['QQQ'] || {};
    let spyCorr = 0;
    let qqqCorr = 0;
    Object.entries(portfolioSectorWeights).forEach(([sector, weight]) => {
      const spyWeight = spySectors[sector] || 0;
      const qqqWeight = qqqSectors[sector] || 0;
      spyCorr += weight * spyWeight * (SECTOR_CORRELATIONS[sector]?.[sector] || 0.5);
      qqqCorr += weight * qqqWeight * (SECTOR_CORRELATIONS[sector]?.[sector] || 0.5);
    });
    spyCorr = Math.min(0.95, Math.max(0.3, spyCorr * 2 + 0.4));
    qqqCorr = Math.min(0.95, Math.max(0.3, qqqCorr * 2 + 0.3));
    return { spy: spyCorr, qqq: qqqCorr };
  }, [portfolioSectorWeights]);

  const riskProfile = useMemo(() => {
    const techExposure = (portfolioSectorWeights['Technology'] || 0) + (portfolioSectorWeights['Communication'] || 0);
    const defensiveExposure = (portfolioSectorWeights['Healthcare'] || 0) + (portfolioSectorWeights['Utilities'] || 0) + (portfolioSectorWeights['Consumer'] || 0);
    const cyclicalExposure = (portfolioSectorWeights['Finance'] || 0) + (portfolioSectorWeights['Industrial'] || 0) + (portfolioSectorWeights['Energy'] || 0) + (portfolioSectorWeights['Materials'] || 0);
    return { techExposure, defensiveExposure, cyclicalExposure };
  }, [portfolioSectorWeights]);

  const maxAssetWeight = useMemo(() => {
    const totalValue = mergedAssets.reduce((sum, a) => sum + a.totalValue, 0);
    if (totalValue === 0) return 0;
    const weights = mergedAssets.map(a => a.totalValue / totalValue);
    return Math.max(...weights, 0);
  }, [mergedAssets]);

  const topSectorWeight = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    return Math.max(...weights, 0);
  }, [portfolioSectorWeights]);

  const riskMetrics = useMemo(() => {
    return calculateRiskMetrics(
      diversificationScore,
      topSectorWeight,
      market.vix || 15,
      maxAssetWeight
    );
  }, [diversificationScore, topSectorWeight, market.vix, maxAssetWeight]);

  const riskLevel = getRiskLevel(riskMetrics.overallScore);
  const riskColor = getRiskColor(riskLevel);

  const portfolioStats = useMemo(() => {
    const totalValue = mergedAssets.reduce((sum, a) => sum + a.totalValue, 0);
    const assetWeights = mergedAssets
      .map(a => ({
        ticker: a.ticker,
        value: a.totalValue,
        weight: totalValue > 0 ? (a.totalValue / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    const coreValue = mergedAssets.filter(a => a.type !== 'INCOME').reduce((s, a) => s + a.totalValue, 0);
    const incomeValue = mergedAssets.filter(a => a.type === 'INCOME').reduce((s, a) => s + a.totalValue, 0);

    const sorted = mergedAssets
      .map(a => {
        const value = a.totalValue;
        const cost = a.totalCost;
        const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
        return { ticker: a.ticker, returnPct };
      })
      .sort((a, b) => b.returnPct - a.returnPct);

    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    return {
      totalValue,
      assetWeights,
      coreValue,
      incomeValue,
      corePct: totalValue > 0 ? (coreValue / totalValue) * 100 : 0,
      incomePct: totalValue > 0 ? (incomeValue / totalValue) * 100 : 0,
      top3,
      bottom3,
    };
  }, [mergedAssets]);

  return {
    riskMetrics,
    riskLevel,
    riskColor,
    riskProfile,
    marketCorrelations,
    topSectors,
    portfolioStats,
    maxAssetWeight,
  };
}
