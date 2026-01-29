'use client';

import { formatUSD } from '@/lib/utils';
import { PortfolioStats } from '@/lib/hooks/usePortfolioStats';

// ═══════════════════════════════════════════════════════════════
// STELLAR HEADER - 타이틀 + 버튼 + 퀵스탯 통합 컴포넌트
// ═══════════════════════════════════════════════════════════════

interface StellarHeaderProps {
  stats: PortfolioStats;
  viewMode: 'table' | 'heatmap';
  isColSettingsOpen: boolean;
  onViewModeChange: (mode: 'table' | 'heatmap') => void;
  onColSettingsToggle: () => void;
  onRefresh: () => void;
  onAddAsset: () => void;
}

export default function StellarHeader({
  stats,
  viewMode,
  isColSettingsOpen,
  onViewModeChange,
  onColSettingsToggle,
  onRefresh,
  onAddAsset,
}: StellarHeaderProps) {
  const { totalValue, returnPct, assetCount, avgBuyRate } = stats;
  const plClass = returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger';
  const plBg = returnPct >= 0 ? 'from-v64-success/15 to-transparent' : 'from-v64-danger/15 to-transparent';
  const plBorder = returnPct >= 0 ? 'border-v64-success/20' : 'border-v64-danger/20';
  const plIconBg = returnPct >= 0 ? 'bg-v64-success/20' : 'bg-v64-danger/20';

  return (
    <div className="flex items-stretch mb-4 pb-2 border-b border-white/10 gap-3">
      {/* Left: Title + Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h2 className="flex items-center gap-2 h-[42px] text-lg font-display tracking-widest text-white">
          <i className="fas fa-star text-celestial-gold" /> STELLAR ASSETS
        </h2>
        {/* Column Settings Button */}
        <button
          onClick={onColSettingsToggle}
          className={`inner-glass rounded-lg px-3 h-[42px] flex items-center gap-1.5 text-xs font-bold transition-all ${
            isColSettingsOpen ? 'text-celestial-cyan border border-celestial-cyan/30' : 'text-white/80 hover:text-white'
          }`}
          title="컬럼 설정"
        >
          <i className="fas fa-columns" />
          <span className="hidden sm:inline">컬럼</span>
        </button>
        {/* View Mode Toggle: Table / Heatmap */}
        <div className="flex items-center gap-1 inner-glass rounded-lg p-1 h-[42px]">
          <button
            onClick={() => onViewModeChange('table')}
            className={`px-3 h-full rounded text-xs font-bold tracking-wide transition-all flex items-center ${
              viewMode === 'table'
                ? 'bg-celestial-cyan/20 text-celestial-cyan border border-celestial-cyan/30'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <i className="fas fa-table mr-1.5" />
            TABLE
          </button>
          <button
            onClick={() => onViewModeChange('heatmap')}
            className={`px-3 h-full rounded text-xs font-bold tracking-wide transition-all flex items-center ${
              viewMode === 'heatmap'
                ? 'bg-celestial-purple/20 text-celestial-purple border border-celestial-purple/30'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <i className="fas fa-th-large mr-1.5" />
            HEATMAP
          </button>
        </div>
        <button
          onClick={onRefresh}
          className="inner-glass rounded-lg px-3 h-[42px] flex items-center justify-center text-xs font-bold text-white/80 hover:text-white transition-all"
        >
          <i className="fas fa-sync-alt" />
        </button>
        <button
          onClick={onAddAsset}
          className="inner-glass rounded-lg px-4 h-[42px] flex items-center justify-center text-xs font-bold text-celestial-gold border border-celestial-gold/30 transition-all"
        >
          IGNITE STAR
        </button>
      </div>

      {/* Right: Quick Stats */}
      <div className="flex-1 grid grid-cols-4 gap-2 h-full">
        {/* 총 평가 */}
        <div className="inner-glass px-3 rounded-lg bg-gradient-to-r from-celestial-cyan/15 to-transparent border border-celestial-cyan/20 h-[42px] flex items-center">
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-celestial-cyan/20 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-wallet text-xs text-celestial-cyan" />
              </div>
              <span className="text-xs text-white font-bold">총 평가</span>
            </div>
            <span className="text-base font-display font-bold text-celestial-cyan">
              {formatUSD(totalValue)}
            </span>
          </div>
        </div>

        {/* 수익률 */}
        <div className={`inner-glass px-3 rounded-lg bg-gradient-to-r ${plBg} border ${plBorder} h-[42px] flex items-center`}>
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${plIconBg}`}>
                <i className={`fas fa-chart-line text-xs ${plClass}`} />
              </div>
              <span className="text-xs text-white font-bold">수익률</span>
            </div>
            <span className={`text-base font-display font-bold ${plClass}`}>
              {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* 종목수 */}
        <div className="inner-glass px-3 rounded-lg bg-gradient-to-r from-celestial-purple/15 to-transparent border border-celestial-purple/20 h-[42px] flex items-center">
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-celestial-purple/20 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-layer-group text-xs text-celestial-purple" />
              </div>
              <span className="text-xs text-white font-bold">종목수</span>
            </div>
            <span className="text-base font-display font-bold text-celestial-purple">
              {assetCount}<span className="text-xs text-white/60 ml-1">종목</span>
            </span>
          </div>
        </div>

        {/* 평균 매수환율 */}
        <div className="inner-glass px-3 rounded-lg bg-gradient-to-r from-celestial-gold/15 to-transparent border border-celestial-gold/20 h-[42px] flex items-center">
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-celestial-gold/20 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-balance-scale text-xs text-celestial-gold" />
              </div>
              <span className="text-xs text-white font-bold">매수환율</span>
            </div>
            <span className="text-base font-display font-bold text-celestial-gold">
              <span className="text-xs text-white/60 mr-0.5">₩</span>
              {avgBuyRate > 0 ? avgBuyRate.toFixed(0) : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
