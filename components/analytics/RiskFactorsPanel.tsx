'use client';

import { useMemo } from 'react';
import { RiskMetrics } from '@/lib/types';

interface RiskFactor {
  key: string;
  label: string;
  score: number;
  trend?: 'up' | 'down' | 'stable';
}

interface RiskFactorsPanelProps {
  riskMetrics: RiskMetrics;
  marketCorrelations?: { spy: number; qqq: number };
  beta?: number;
  sharpeRatio?: number;
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'danger';
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#81C784';
  if (score >= 40) return '#FFD700';
  return '#E57373';
}

export default function RiskFactorsPanel({
  riskMetrics,
  marketCorrelations,
  beta = 1.0,
  sharpeRatio = 0,
}: RiskFactorsPanelProps) {
  const factors: RiskFactor[] = useMemo(() => [
    {
      key: 'diversification',
      label: '분산도',
      score: riskMetrics.diversificationScore,
      trend: 'stable',
    },
    {
      key: 'concentration',
      label: '집중위험',
      score: riskMetrics.concentrationRisk,
      trend: 'stable',
    },
    {
      key: 'volatility',
      label: '변동성',
      score: riskMetrics.volatilityScore,
      trend: 'stable',
    },
    {
      key: 'sector',
      label: '섹터집중',
      score: riskMetrics.sectorConcentration,
      trend: 'stable',
    },
  ], [riskMetrics]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable' | undefined) => {
    switch (trend) {
      case 'up': return { icon: '↑', className: 'up' };
      case 'down': return { icon: '↓', className: 'down' };
      default: return { icon: '→', className: 'stable' };
    }
  };

  return (
    <div className="risk-factors-panel h-full">
      <h3 className="text-sm font-display tracking-widest text-white/80 mb-4 flex items-center gap-2">
        <i className="fas fa-chart-bar text-celestial-purple text-xs" aria-hidden="true" />
        리스크 요인
      </h3>

      {/* Factor Bars */}
      <div className="space-y-1">
        {factors.map((factor) => {
          const trendInfo = getTrendIcon(factor.trend);
          return (
            <div key={factor.key} className="risk-factor-row">
              <span className="risk-factor-label">{factor.label}</span>
              <div className="risk-factor-bar">
                <div
                  className={`risk-factor-fill ${getScoreClass(factor.score)}`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
              <span
                className="risk-factor-value"
                style={{ color: getScoreColor(factor.score) }}
              >
                {Math.round(factor.score)}
              </span>
              <span className={`risk-factor-trend ${trendInfo.className}`}>
                {trendInfo.icon}
              </span>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="metrics-row">
        <div className="metric-item">
          <span className="metric-label">베타</span>
          <span className="metric-value" style={{ color: beta > 1.2 ? '#FFB74D' : '#81C784' }}>
            {beta.toFixed(2)}
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">샤프</span>
          <span className="metric-value" style={{ color: sharpeRatio > 1 ? '#81C784' : sharpeRatio > 0 ? '#FFD700' : '#E57373' }}>
            {sharpeRatio.toFixed(2)}
          </span>
        </div>
        {marketCorrelations && (
          <>
            <div className="metric-item">
              <span className="metric-label">SPY 상관</span>
              <span className="metric-value">
                {marketCorrelations.spy.toFixed(2)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">QQQ 상관</span>
              <span className="metric-value">
                {marketCorrelations.qqq.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
