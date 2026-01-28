'use client';

import { formatUSD } from '@/lib/utils';
import { PortfolioStats } from '@/lib/hooks/usePortfolioStats';
import { TYPE_INFO, TYPE_COLORS, TYPE_ORDER } from '@/lib/config';
import TradeJournal from '../TradeJournal';

// ═══════════════════════════════════════════════════════════════
// INSIGHTS PANEL - Stellar Assets 우측 인사이트 패널
// ═══════════════════════════════════════════════════════════════

interface InsightsPanelProps {
  stats: PortfolioStats;
}

export default function InsightsPanel({ stats }: InsightsPanelProps) {
  const { typeDistribution, topPerformers } = stats;

  // 타입 순서대로 정렬
  const sortedTypes = TYPE_ORDER.filter(type => typeDistribution[type]?.count > 0);

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Type Distribution */}
      <div className="inner-glass p-3 rounded-xl">
        <h4 className="text-[10px] tracking-widest text-celestial-cyan mb-3 flex items-center gap-2">
          <i className="fas fa-chart-pie" />
          TYPE DISTRIBUTION
        </h4>
        <div className="space-y-2">
          {sortedTypes.map(type => {
            const data = typeDistribution[type];
            const typeInfo = TYPE_INFO[type as keyof typeof TYPE_INFO];
            const typeColor = TYPE_COLORS[type as keyof typeof TYPE_COLORS] || TYPE_COLORS.CORE;

            return (
              <div key={type} className="flex items-center gap-2">
                <div className="w-16 text-[9px] text-white/80 flex items-center gap-1">
                  <i className={`fas fa-${typeInfo?.icon || 'star'} text-[8px]`} style={{ color: typeColor }} />
                  {type}
                </div>
                <div className="flex-1 h-4 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, data.weight)}%`,
                      backgroundColor: typeColor,
                      opacity: 0.7,
                    }}
                  />
                </div>
                <div className="w-12 text-[9px] text-white/70 text-right font-mono">
                  {data.weight.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Performers */}
      <div className="inner-glass p-3 rounded-xl">
        <h4 className="text-[10px] tracking-widest text-celestial-gold mb-3 flex items-center gap-2">
          <i className="fas fa-trophy" />
          TOP PERFORMERS
        </h4>
        <div className="space-y-2">
          {topPerformers.map((asset, idx) => {
            const medals = ['🥇', '🥈', '🥉'];
            const plClass = asset.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger';

            return (
              <div key={asset.ticker} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{medals[idx]}</span>
                  <span className="text-[11px] font-medium text-white">{asset.ticker}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-mono ${plClass}`}>
                    {asset.returnPct >= 0 ? '+' : ''}{asset.returnPct.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-white/60">
                    {formatUSD(asset.value)}
                  </span>
                </div>
              </div>
            );
          })}
          {topPerformers.length === 0 && (
            <div className="text-[10px] text-white/60 text-center py-2">
              자산을 추가하세요
            </div>
          )}
        </div>
      </div>

      {/* Trade Journal */}
      <div className="inner-glass p-3 rounded-xl flex-1 min-h-0 overflow-hidden flex flex-col">
        <h4 className="text-[10px] tracking-widest text-orange-400 mb-3 flex items-center gap-2">
          <i className="fas fa-receipt" />
          TRADE JOURNAL
        </h4>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <TradeJournal compact />
        </div>
      </div>
    </div>
  );
}
