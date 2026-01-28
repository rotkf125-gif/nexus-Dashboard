'use client';

import { useNexus } from '@/lib/context';
import { useRiskAnalytics } from '@/lib/hooks/useRiskAnalytics';
import BubbleChart from './charts/BubbleChart';
import CorrelationHeatmap from './charts/CorrelationHeatmap';
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

  // 배당주 개수 (병합된 종목 기준)
  const incomeAssetCount = portfolioStats.incomeAssetCount;

  // 최대 비중 자산 티커
  const topAssetTicker = portfolioStats.assetWeights[0]?.ticker;

  if (assets.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="text-center py-12 opacity-70">
          <i className="fas fa-chart-pie text-4xl mb-4 opacity-30" aria-hidden="true" />
          <div className="text-sm">자산을 추가하세요</div>
        </div>
      </div>
    );
  }

  // Command Center 레이아웃 (리뉴얼)
  if (horizontal) {
    // KPI 데이터 준비
    const kpiItems = [
      {
        label: 'HEALTH',
        value: riskMetrics.overallScore,
        trend: riskMetrics.overallScore >= 70 ? 'up' : riskMetrics.overallScore >= 50 ? 'neutral' : 'down',
        color: riskColor,
      },
      {
        label: 'DIVERSE',
        value: riskMetrics.diversificationScore,
        trend: riskMetrics.diversificationScore >= 60 ? 'up' : 'down',
        color: riskMetrics.diversificationScore >= 70 ? '#22c55e' : riskMetrics.diversificationScore >= 40 ? '#eab308' : '#ef4444',
      },
      {
        label: 'CONC.',
        value: riskMetrics.concentrationRisk,
        trend: riskMetrics.concentrationRisk >= 60 ? 'up' : 'down',
        color: riskMetrics.concentrationRisk >= 70 ? '#22c55e' : riskMetrics.concentrationRisk >= 40 ? '#eab308' : '#ef4444',
      },
      {
        label: 'VOLATIL',
        value: riskMetrics.volatilityScore,
        trend: riskMetrics.volatilityScore >= 60 ? 'up' : 'down',
        color: riskMetrics.volatilityScore >= 70 ? '#22c55e' : riskMetrics.volatilityScore >= 40 ? '#eab308' : '#ef4444',
      },
    ];

    return (
      <div className="glass-card p-4 lg:p-5">
        {/* Row 1: KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {/* KPI Cards */}
          {kpiItems.map((kpi) => (
            <div key={kpi.label} className="inner-glass p-3 rounded-xl text-center">
              <div className="text-[9px] text-white/60 tracking-widest mb-1">{kpi.label}</div>
              <div className="text-2xl font-display" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: kpi.color }}>
                {kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '→'}
              </div>
            </div>
          ))}

          {/* Risk Level Badge */}
          <div className="inner-glass p-3 rounded-xl text-center border" style={{ borderColor: `${riskColor}40` }}>
            <div className="text-[9px] text-white/60 tracking-widest mb-1">RISK LEVEL</div>
            <div
              className="text-lg font-display tracking-wider"
              style={{ color: riskColor }}
            >
              {riskLevel === 'LOW' ? '🟢' : riskLevel === 'MODERATE' ? '🟡' : riskLevel === 'HIGH' ? '🟠' : '🔴'} {riskLevel}
            </div>
          </div>
        </div>

        {/* Row 2: Bubble Chart - Full Width Hero */}
        <div className="mb-5">
          <BubbleChart />
        </div>

        {/* Row 3: Insights + Correlation (5:5) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Insight Alerts */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
              <i className="fas fa-lightbulb text-celestial-gold text-xs" />
              <span className="text-[10px] text-white/80 tracking-widest">INSIGHT ALERTS</span>
            </div>
            <InsightChips
              riskMetrics={riskMetrics}
              riskProfile={riskProfile}
              market={market}
              maxAssetWeight={maxAssetWeight}
              topAssetTicker={topAssetTicker}
              incomeAssetCount={incomeAssetCount}
            />
          </div>

          {/* Correlation Matrix */}
          <div className="inner-glass rounded-xl overflow-hidden">
            <CorrelationHeatmap collapsible defaultExpanded={true} />
          </div>
        </div>
      </div>
    );
  }

  // 세로 레이아웃 (사이드바용 컴팩트 버전)
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <i className="fas fa-shield-alt text-celestial-cyan" aria-hidden="true" />
        <h3 className="font-display text-sm tracking-widest text-white">ANALYTICS</h3>
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
