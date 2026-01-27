'use client';

import { useNexus } from '@/lib/context';
import { useRiskAnalytics } from '@/lib/hooks/useRiskAnalytics';
import BubbleChart from './charts/BubbleChart';
import CorrelationHeatmap from './charts/CorrelationHeatmap';
import HealthScore from './analytics/HealthScore';
import RiskFactorsPanel from './analytics/RiskFactorsPanel';
import InsightChips from './analytics/InsightChips';

interface AnalyticsProps {
  horizontal?: boolean;
}

export default function Analytics({ horizontal = false }: AnalyticsProps) {
  const { state } = useNexus();
  const { assets, market } = state;

  const {
    riskMetrics,
    riskLevel,
    riskColor,
    riskProfile,
    marketCorrelations,
    portfolioStats,
    maxAssetWeight
  } = useRiskAnalytics(assets, market);

  // 배당주 개수 계산
  const incomeAssetCount = assets.filter(a => a.type === 'INCOME').length;

  // 최대 비중 자산 티커
  const topAssetTicker = portfolioStats.assetWeights[0]?.ticker;

  if (assets.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="text-center py-12 opacity-50">
          <i className="fas fa-chart-pie text-4xl mb-4 opacity-30" aria-hidden="true" />
          <div className="text-sm">자산을 추가하세요</div>
        </div>
      </div>
    );
  }

  // 가로 레이아웃 (리뉴얼된 레이아웃)
  if (horizontal) {
    return (
      <div className="glass-card p-3 md:p-4 lg:p-5">
        {/* Row 1: Health Score */}
        <div className="mb-4">
          <div className="inner-glass p-4 rounded-xl">
            <HealthScore
              score={riskMetrics.overallScore}
              riskLevel={riskLevel}
              riskColor={riskColor}
            />
          </div>
        </div>

        {/* Row 2: Bubble Chart + Risk Factors Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Bubble Chart - 2/3 width */}
          <div className="lg:col-span-2">
            <BubbleChart />
          </div>

          {/* Risk Factors Panel - 1/3 width */}
          <div className="inner-glass p-4 rounded-xl">
            <RiskFactorsPanel
              riskMetrics={riskMetrics}
              marketCorrelations={marketCorrelations}
              beta={1.0 + (riskProfile.cyclicalExposure - 0.3)}
              sharpeRatio={
                // 상위 3개 수익률 평균 기반 간이 샤프 계산
                portfolioStats.top3.length > 0
                  ? (portfolioStats.top3.reduce((sum, a) => sum + a.returnPct, 0) / portfolioStats.top3.length) /
                    (riskMetrics.volatilityScore > 0 ? (100 - riskMetrics.volatilityScore) / 20 : 1) / 10
                  : 0
              }
            />
          </div>
        </div>

        {/* Row 3: Insight Chips */}
        <div className="mb-4">
          <InsightChips
            riskMetrics={riskMetrics}
            riskProfile={riskProfile}
            market={market}
            maxAssetWeight={maxAssetWeight}
            topAssetTicker={topAssetTicker}
            incomeAssetCount={incomeAssetCount}
          />
        </div>

        {/* Row 4: Collapsible Correlation Heatmap */}
        <div className="inner-glass rounded-xl overflow-hidden">
          <CorrelationHeatmap collapsible defaultExpanded={false} />
        </div>
      </div>
    );
  }

  // 세로 레이아웃 (사이드바용 컴팩트 버전)
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <i className="fas fa-shield-alt text-celestial-cyan" aria-hidden="true" />
        <h3 className="font-display text-sm tracking-widest text-white/90">ANALYTICS</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-4">
        {/* Compact Health Score */}
        <div className="text-center">
          <div className="text-3xl font-display mb-1" style={{ color: riskColor }}>
            {riskMetrics.overallScore}
          </div>
          <div className="text-xs text-white/60">포트폴리오 점수</div>
        </div>

        {/* Compact Risk Factors */}
        <div className="space-y-2">
          {[
            { label: '분산도', score: riskMetrics.diversificationScore },
            { label: '섹터 집중', score: riskMetrics.sectorConcentration },
            { label: '변동성', score: riskMetrics.volatilityScore },
            { label: '종목 집중', score: riskMetrics.concentrationRisk },
          ].map(factor => (
            <div key={factor.label} className="inner-glass p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-white/60">{factor.label}</span>
                <span className={`text-xs font-mono ${
                  factor.score >= 70 ? 'text-v64-success' : factor.score >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
                }`}>
                  {factor.score}
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    factor.score >= 70 ? 'bg-v64-success' : factor.score >= 40 ? 'bg-celestial-gold' : 'bg-v64-danger'
                  }`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Compact Insight Chips */}
        <InsightChips
          riskMetrics={riskMetrics}
          riskProfile={riskProfile}
          market={market}
          maxAssetWeight={maxAssetWeight}
          topAssetTicker={topAssetTicker}
          incomeAssetCount={incomeAssetCount}
        />
      </div>
    </div>
  );
}
