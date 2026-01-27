'use client';

import { useMemo } from 'react';
import { RiskLevel } from '@/lib/types';
import { getRiskLabel } from '@/lib/hooks/useRiskAnalytics';

interface HealthScoreProps {
  score: number;
  previousScore?: number;
  riskLevel: RiskLevel;
  riskColor: string;
}

export default function HealthScore({
  score,
  previousScore,
  riskLevel,
  riskColor,
}: HealthScoreProps) {
  const trend = useMemo(() => {
    if (previousScore === undefined) return null;
    const delta = score - previousScore;
    if (Math.abs(delta) < 1) return { type: 'stable' as const, delta: 0 };
    return {
      type: delta > 0 ? 'positive' as const : 'negative' as const,
      delta: Math.round(delta),
    };
  }, [score, previousScore]);

  const riskBadgeClass = useMemo(() => {
    switch (riskLevel) {
      case 'LOW': return 'low';
      case 'MODERATE': return 'moderate';
      case 'HIGH': return 'high';
      case 'EXTREME': return 'extreme';
      default: return 'moderate';
    }
  }, [riskLevel]);

  return (
    <div className="health-score-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display tracking-widest text-white/80 flex items-center gap-2">
          <i className="fas fa-heartbeat text-celestial-cyan text-xs" aria-hidden="true" />
          포트폴리오 건강 점수
        </h3>
        <div className={`risk-badge ${riskBadgeClass}`}>
          <i className="fas fa-shield-alt text-[10px]" aria-hidden="true" />
          {getRiskLabel(riskLevel)}
        </div>
      </div>

      <div className="flex items-end gap-4 mb-4">
        {/* Score */}
        <div className="flex items-baseline gap-2">
          <span
            className="health-score-value"
            style={{ color: riskColor }}
          >
            {score}
          </span>
          <span className="text-lg text-white/40">점</span>
        </div>

        {/* Trend */}
        {trend && (
          <div className={`health-trend ${trend.type}`}>
            {trend.type === 'positive' && (
              <>
                <i className="fas fa-arrow-up text-[10px]" aria-hidden="true" />
                <span>+{trend.delta}</span>
              </>
            )}
            {trend.type === 'negative' && (
              <>
                <i className="fas fa-arrow-down text-[10px]" aria-hidden="true" />
                <span>{trend.delta}</span>
              </>
            )}
            {trend.type === 'stable' && (
              <>
                <i className="fas fa-minus text-[10px]" aria-hidden="true" />
                <span>유지</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="health-progress-track">
        <div
          className="health-progress-fill"
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`건강 점수 ${score}점`}
        />
      </div>

      {/* Scale Labels */}
      <div className="flex justify-between mt-2 text-[9px] text-white/40">
        <span>위험</span>
        <span>주의</span>
        <span>보통</span>
        <span>양호</span>
        <span>최적</span>
      </div>
    </div>
  );
}
