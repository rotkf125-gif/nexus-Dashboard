'use client';

// ═══════════════════════════════════════════════════════════════
// Market Indicators - 시장 지표 컴포넌트
// ═══════════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { MarketData } from '@/lib/types';
import { getMarketStateInfo, isDST, MarketState } from '@/lib/utils';

interface MarketIndicatorsProps {
  market: MarketData;
  exchangeRate: number;
}

export default function MarketIndicators({ market, exchangeRate }: MarketIndicatorsProps) {
  // VIX 계산
  const vixStats = useMemo(() => {
    const vix = market.vix || 15;
    let vixLevel = 'LOW';
    let vixAction = '평상 운용';
    let vixBarWidth = 20;
    let vixBarColor = 'bg-v64-success';

    if (vix <= 15) {
      vixLevel = 'LOW';
      vixAction = '평상 운용';
      vixBarWidth = 20;
      vixBarColor = 'bg-v64-success';
    } else if (vix <= 25) {
      vixLevel = 'NORMAL';
      vixAction = '주의 관찰';
      vixBarWidth = 40;
      vixBarColor = 'bg-v64-success';
    } else if (vix <= 35) {
      vixLevel = 'ELEVATED';
      vixAction = '현금 확보';
      vixBarWidth = 60;
      vixBarColor = 'bg-v64-warning';
    } else if (vix <= 50) {
      vixLevel = 'HIGH';
      vixAction = '방어 모드';
      vixBarWidth = 80;
      vixBarColor = 'bg-v64-danger';
    } else {
      vixLevel = 'EXTREME';
      vixAction = '시장 혼란';
      vixBarWidth = 100;
      vixBarColor = 'bg-v64-danger';
    }

    return { vix, vixLevel, vixAction, vixBarWidth, vixBarColor };
  }, [market.vix]);

  // Market state 정보
  const marketInfo = useMemo(() => {
    const marketState = (market.marketState || 'CLOSED') as MarketState;
    return getMarketStateInfo(marketState);
  }, [market.marketState]);

  const dstActive = useMemo(() => isDST(), []);

  const stateColors = {
    green: 'bg-v64-success/20 text-v64-success border border-v64-success/30',
    blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    gray: 'bg-white/10 text-white/70 border border-white/20',
  };

  return (
    <div className="hidden md:flex gap-3 px-4 lg:px-6 border-l border-r border-white/15">
      {/* Market State Badge */}
      <div className="flex flex-col justify-center items-center min-w-[85px]">
        <div className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider ${stateColors[marketInfo.color as keyof typeof stateColors]}`}>
          {marketInfo.label}
        </div>
        <span className="text-[7px] opacity-80 mt-1">KST {marketInfo.time}</span>
        <span className={`text-[6px] mt-0.5 ${dstActive ? 'text-celestial-gold' : 'text-white/30'}`}>
          {dstActive ? '☀️ DST' : '❄️ STD'}
        </span>
      </div>

      {/* 2x2 Grid: NASDAQ/S&P500, USD/KRW/US10Y */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {/* Row 1 */}
        <div className="flex items-center justify-between gap-3 min-w-[110px]">
          <span className="text-[9px] tracking-widest text-blue-400/80">NASDAQ</span>
          <span className="text-sm font-display text-blue-400">
            {market.nasdaq ? market.nasdaq.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '---'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 min-w-[100px]">
          <span className="text-[9px] tracking-widest text-white/60">USD/KRW</span>
          <span className="text-sm font-display text-white">
            ₩{exchangeRate.toLocaleString()}
          </span>
        </div>
        {/* Row 2 */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] tracking-widest text-emerald-400/80">S&P 500</span>
          <span className="text-sm font-display text-emerald-400">
            {market.sp500 ? market.sp500.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '---'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] tracking-widest text-celestial-gold/80">US 10Y</span>
          <span className="text-sm font-display text-celestial-gold">
            {market.tnx ? market.tnx.toFixed(2) + '%' : '---'}
          </span>
        </div>
      </div>

      {/* VIX Box */}
      <div className="inner-glass px-3 py-1.5 rounded border border-v64-danger/30 min-w-[120px]">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[9px] tracking-widest text-v64-danger/80">VIX</span>
          <span className="text-base font-display text-v64-danger font-medium">
            {vixStats.vix.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${vixStats.vixBarColor}`}
              style={{ width: `${vixStats.vixBarWidth}%` }}
            />
          </div>
          <span className="text-[8px] opacity-90">{vixStats.vixLevel}</span>
        </div>
        <span className="text-[8px] text-celestial-gold/80 font-light block text-right">
          {vixStats.vixAction}
        </span>
      </div>
    </div>
  );
}
