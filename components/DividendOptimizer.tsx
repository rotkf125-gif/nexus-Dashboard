'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { TAX_CONFIG } from '@/lib/config';

interface OptimizationSuggestion {
  type: 'reinvest' | 'rebalance' | 'yield' | 'concentration';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  ticker?: string;
  value?: number;
  action?: string;
}

const { AFTER_TAX_RATE } = TAX_CONFIG;

export default function DividendOptimizer() {
  const { state } = useNexus();
  const { assets, dividends, exchangeRate } = state;

  // INCOME 자산만 필터링
  const incomeAssets = useMemo(() => assets.filter(a => a.type === 'INCOME'), [assets]);

  // 배당금 데이터 집계
  const dividendStats = useMemo(() => {
    const stats: Record<string, { totalDividend: number; avgDps: number; count: number; lastDate: string }> = {};

    dividends.forEach(d => {
      if (!stats[d.ticker]) {
        stats[d.ticker] = { totalDividend: 0, avgDps: 0, count: 0, lastDate: '' };
      }
      stats[d.ticker].totalDividend += d.qty * d.dps * AFTER_TAX_RATE;
      stats[d.ticker].avgDps = (stats[d.ticker].avgDps * stats[d.ticker].count + d.dps) / (stats[d.ticker].count + 1);
      stats[d.ticker].count++;
      if (d.date > stats[d.ticker].lastDate) {
        stats[d.ticker].lastDate = d.date;
      }
    });

    return stats;
  }, [dividends]);

  // 최적화 제안 생성
  const suggestions = useMemo((): OptimizationSuggestion[] => {
    const result: OptimizationSuggestion[] = [];

    if (incomeAssets.length === 0) return result;

    // 1. 전체 INCOME 포트폴리오 분석
    const totalIncomeValue = incomeAssets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalDividend = Object.values(dividendStats).reduce((sum, s) => sum + s.totalDividend, 0);

    // 2. 각 자산별 분석
    const assetAnalysis = incomeAssets.map(asset => {
      const stats = dividendStats[asset.ticker] || { totalDividend: 0, avgDps: 0, count: 0, lastDate: '' };
      const value = asset.qty * asset.price;
      const cost = asset.qty * asset.avg;
      const weight = totalIncomeValue > 0 ? (value / totalIncomeValue) * 100 : 0;
      const yieldOnCost = cost > 0 && stats.avgDps > 0 ? (stats.avgDps * 52 * asset.qty * AFTER_TAX_RATE / cost) * 100 : 0;
      const currentYield = value > 0 && stats.avgDps > 0 ? (stats.avgDps * 52 * asset.qty * AFTER_TAX_RATE / value) * 100 : 0;

      return {
        ...asset,
        stats,
        value,
        cost,
        weight,
        yieldOnCost,
        currentYield,
      };
    });

    // 3. 집중도 경고 (50% 이상)
    const overweightAssets = assetAnalysis.filter(a => a.weight > 50);
    overweightAssets.forEach(asset => {
      result.push({
        type: 'concentration',
        priority: 'high',
        title: `${asset.ticker} 집중도 경고`,
        description: `INCOME 포트폴리오의 ${asset.weight.toFixed(1)}%가 ${asset.ticker}에 집중되어 있습니다. 분산 투자를 고려하세요.`,
        ticker: asset.ticker,
        value: asset.weight,
        action: '분산 투자 권장',
      });
    });

    // 4. 수익률 기반 재투자 제안
    const highYieldAssets = assetAnalysis
      .filter(a => a.yieldOnCost > 8)
      .sort((a, b) => b.yieldOnCost - a.yieldOnCost);

    if (highYieldAssets.length > 0) {
      const best = highYieldAssets[0];
      result.push({
        type: 'reinvest',
        priority: 'medium',
        title: '배당 재투자 추천',
        description: `${best.ticker}의 YOC(Yield on Cost)가 ${best.yieldOnCost.toFixed(1)}%로 높습니다. 배당금 재투자로 복리 효과를 극대화하세요.`,
        ticker: best.ticker,
        value: best.yieldOnCost,
        action: '재투자 고려',
      });
    }

    // 5. 저수익률 자산 경고
    const lowYieldAssets = assetAnalysis
      .filter(a => a.yieldOnCost > 0 && a.yieldOnCost < 4 && a.stats.count >= 4)
      .sort((a, b) => a.yieldOnCost - b.yieldOnCost);

    if (lowYieldAssets.length > 0) {
      const worst = lowYieldAssets[0];
      result.push({
        type: 'yield',
        priority: 'low',
        title: '저수익률 자산 검토',
        description: `${worst.ticker}의 YOC가 ${worst.yieldOnCost.toFixed(1)}%로 낮습니다. 더 높은 수익률 자산으로 교체를 검토하세요.`,
        ticker: worst.ticker,
        value: worst.yieldOnCost,
        action: '교체 검토',
      });
    }

    // 6. 리밸런싱 제안 (편차가 큰 경우)
    if (assetAnalysis.length >= 2) {
      const avgWeight = 100 / assetAnalysis.length;
      const imbalancedAssets = assetAnalysis.filter(a => Math.abs(a.weight - avgWeight) > 15);

      if (imbalancedAssets.length > 0) {
        result.push({
          type: 'rebalance',
          priority: 'medium',
          title: '리밸런싱 권장',
          description: `INCOME 자산 간 비중 편차가 큽니다. 균등 배분을 위한 리밸런싱을 고려하세요.`,
          action: '비중 조정',
        });
      }
    }

    // 7. 월별 배당금 안정성 분석
    const monthlyDividends: Record<string, number> = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7);
      monthlyDividends[month] = (monthlyDividends[month] || 0) + d.qty * d.dps * AFTER_TAX_RATE;
    });

    const monthlyValues = Object.values(monthlyDividends);
    if (monthlyValues.length >= 3) {
      const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
      const variance = monthlyValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / monthlyValues.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? (stdDev / avg) * 100 : 0;

      if (cv > 30) {
        result.push({
          type: 'rebalance',
          priority: 'low',
          title: '배당 변동성 주의',
          description: `월별 배당금 변동성이 ${cv.toFixed(0)}%로 높습니다. 안정적인 배당 자산 추가를 고려하세요.`,
          value: cv,
          action: '안정성 개선',
        });
      }
    }

    return result.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [incomeAssets, dividendStats]);

  // 포트폴리오 요약 통계
  const portfolioSummary = useMemo(() => {
    const totalValue = incomeAssets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalCost = incomeAssets.reduce((sum, a) => sum + a.qty * a.avg, 0);
    const totalDividend = Object.values(dividendStats).reduce((sum, s) => sum + s.totalDividend, 0);
    const avgYieldOnCost = totalCost > 0 ? (totalDividend / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalDividend,
      avgYieldOnCost,
      assetCount: incomeAssets.length,
    };
  }, [incomeAssets, dividendStats]);

  if (incomeAssets.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reinvest': return 'fa-redo-alt';
      case 'rebalance': return 'fa-balance-scale';
      case 'yield': return 'fa-percentage';
      case 'concentration': return 'fa-exclamation-triangle';
      default: return 'fa-lightbulb';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-widest text-celestial-gold font-medium uppercase flex items-center gap-2">
          <i className="fas fa-magic" />
          DIVIDEND OPTIMIZER
        </h3>
        <span className="text-[9px] text-white/70">
          {suggestions.length}개 제안
        </span>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/70 uppercase mb-1">총 배당금</div>
          <div className="text-[13px] text-celestial-gold font-semibold">
            ${portfolioSummary.totalDividend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/70 uppercase mb-1">평균 YOC</div>
          <div className="text-[13px] text-v64-success font-semibold">
            {portfolioSummary.avgYieldOnCost.toFixed(1)}%
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/70 uppercase mb-1">원금 회수율</div>
          <div className="text-[13px] text-celestial-cyan font-semibold">
            {portfolioSummary.totalCost > 0
              ? ((portfolioSummary.totalDividend / portfolioSummary.totalCost) * 100).toFixed(1)
              : '0'}%
          </div>
        </div>
        <div className="inner-glass p-2.5 rounded text-center">
          <div className="text-[8px] text-white/70 uppercase mb-1">INCOME 자산</div>
          <div className="text-[13px] text-white font-semibold">
            {portfolioSummary.assetCount}종목
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((suggestion, i) => (
            <div
              key={i}
              className={`inner-glass p-3 rounded-lg border ${getPriorityColor(suggestion.priority)} transition-all hover:bg-white/5`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getPriorityColor(suggestion.priority)}`}>
                  <i className={`fas ${getTypeIcon(suggestion.type)} text-xs`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-white">{suggestion.title}</span>
                    {suggestion.ticker && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                        {suggestion.ticker}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/60 leading-relaxed">
                    {suggestion.description}
                  </p>
                  {suggestion.action && (
                    <div className="mt-2">
                      <span className="text-[9px] px-2 py-1 rounded bg-white/5 text-white/70 border border-white/10">
                        <i className="fas fa-arrow-right mr-1.5 text-[8px]" />
                        {suggestion.action}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="inner-glass p-4 rounded-lg text-center">
          <i className="fas fa-check-circle text-v64-success text-xl mb-2" />
          <div className="text-[11px] text-white/70">
            현재 INCOME 포트폴리오가 최적화되어 있습니다!
          </div>
        </div>
      )}
    </div>
  );
}
