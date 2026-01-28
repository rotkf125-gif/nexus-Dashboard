'use client';

import { formatUSD } from '@/lib/utils';
import { PortfolioStats } from '@/lib/hooks/usePortfolioStats';

// ═══════════════════════════════════════════════════════════════
// QUICK STATS - Stellar Assets 상단 요약 통계
// ═══════════════════════════════════════════════════════════════

interface QuickStatsProps {
  stats: PortfolioStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const { totalValue, returnPct, assetCount, avgBuyRate } = stats;
  const plClass = returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger';

  return (
    <div className="inner-glass p-3 rounded-xl mb-4">
      <div className="grid grid-cols-4 gap-4">
        {/* 총 평가 */}
        <div className="text-center">
          <div className="text-[8px] text-white/60 tracking-wider mb-1">
            <i className="fas fa-wallet mr-1" />
            총 평가
          </div>
          <div className="text-[15px] font-display text-white">
            {formatUSD(totalValue)}
          </div>
        </div>

        {/* 수익률 */}
        <div className="text-center">
          <div className="text-[8px] text-white/60 tracking-wider mb-1">
            <i className="fas fa-chart-line mr-1" />
            수익률
          </div>
          <div className={`text-[15px] font-display ${plClass}`}>
            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
          </div>
        </div>

        {/* 종목수 */}
        <div className="text-center">
          <div className="text-[8px] text-white/60 tracking-wider mb-1">
            <i className="fas fa-layer-group mr-1" />
            종목수
          </div>
          <div className="text-[15px] font-display text-white">
            {assetCount}<span className="text-[10px] text-white/60 ml-1">종목</span>
          </div>
        </div>

        {/* 평균 매수환율 */}
        <div className="text-center">
          <div className="text-[8px] text-white/60 tracking-wider mb-1">
            <i className="fas fa-balance-scale mr-1" />
            평균 매수환율
          </div>
          <div className="text-[15px] font-display text-white">
            <span className="text-[10px] text-white/60 mr-0.5">₩</span>
            {avgBuyRate > 0 ? avgBuyRate.toFixed(0) : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
