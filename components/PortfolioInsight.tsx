'use client';

import { useNexus } from '@/lib/context';
import { useRiskAnalytics, getRiskLabel } from '@/lib/hooks/useRiskAnalytics';

export default function PortfolioInsight() {
  const { state } = useNexus();
  const { assets, market } = state;

  const {
    riskMetrics,
    riskProfile,
    maxAssetWeight,
    portfolioStats,
  } = useRiskAnalytics(assets, market);

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-widest text-celestial-purple font-medium uppercase flex items-center gap-2">
          <i className="fas fa-lightbulb" />
          PORTFOLIO INSIGHT
        </h3>
      </div>

      {/* Risk Profile */}
      <div className="inner-glass p-4 rounded-lg">
        <div className="text-xs tracking-widest text-white/60 mb-3">리스크 프로필</div>
        <div className="text-[10px] text-white/60 mb-3">포트폴리오 구성 분석 기반</div>
        <div className="flex flex-wrap gap-2">
          {riskProfile.techExposure > 0.1 && (
            <span className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs">
              Tech ({(riskProfile.techExposure * 100).toFixed(0)}%)
            </span>
          )}
          {riskProfile.defensiveExposure > 0.1 && (
            <span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-xs">
              방어 ({(riskProfile.defensiveExposure * 100).toFixed(0)}%)
            </span>
          )}
          {riskProfile.cyclicalExposure > 0.1 && (
            <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs">
              경기 ({(riskProfile.cyclicalExposure * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="inner-glass p-4 rounded-lg">
        <div className="text-xs tracking-widest text-white/60 mb-3">인사이트</div>
        <ul className="text-xs text-white/80 space-y-2.5">
          {riskProfile.defensiveExposure < 0.2 && (
            <li className="flex items-start gap-2">
              <i className="fas fa-info-circle text-sky-400 mt-0.5" />
              <span>변동성을 낮추기 위해 방어 자산 비중을 늘리는 것을 고려하세요.</span>
            </li>
          )}
          {riskProfile.techExposure > 0.4 && (
            <li className="flex items-start gap-2">
              <i className="fas fa-exclamation-triangle text-amber-400 mt-0.5" />
              <span>기술주 섹터 비중이 높습니다. 분산도를 재검토하세요.</span>
            </li>
          )}
          {maxAssetWeight > 0.2 && portfolioStats.top3[0] && (
            <li className="flex items-start gap-2">
              <i className="fas fa-eye text-purple-400 mt-0.5" />
              <span>{portfolioStats.top3[0].ticker}의 집중도를 모니터링하세요.</span>
            </li>
          )}
          {riskMetrics.overallScore >= 70 && (
            <li className="flex items-start gap-2">
              <i className="fas fa-check-circle text-emerald-400 mt-0.5" />
              <span>포트폴리오가 잘 분산되어 있습니다. 현재 전략을 유지하세요.</span>
            </li>
          )}
          {market.vix > 25 && (
            <li className="flex items-start gap-2">
              <i className="fas fa-chart-line text-rose-400 mt-0.5" />
              <span>VIX가 상승({market.vix?.toFixed(1)})했습니다. 시장 변동성을 주시하세요.</span>
            </li>
          )}
        </ul>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="inner-glass p-3 rounded-lg text-center">
          <div className="text-[9px] text-white/50 uppercase mb-1">총 자산</div>
          <div className="text-base text-celestial-cyan font-semibold">
            {assets.length}
          </div>
        </div>
        <div className="inner-glass p-3 rounded-lg text-center">
          <div className="text-[9px] text-white/50 uppercase mb-1">리스크</div>
          <div className={`text-base font-semibold ${
            riskMetrics.overallScore >= 70 ? 'text-v64-success' :
            riskMetrics.overallScore >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
          }`}>
            {getRiskLabel(riskMetrics.overallScore >= 70 ? 'LOW' : riskMetrics.overallScore >= 40 ? 'MODERATE' : 'HIGH').split(' ')[0]}
          </div>
        </div>
      </div>
    </div>
  );
}
