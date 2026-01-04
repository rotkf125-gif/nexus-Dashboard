'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { BenchmarkData } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/config';
import { calculatePortfolioStats, getReturnColorClass } from '@/lib/utils';

export default function PerformanceArena() {
  const { state, toast } = useNexus();
  const { assets, exchangeRate } = state;
  const [isExpanded, setIsExpanded] = useState(false);
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // 포트폴리오 수익률 계산 (using utility)
  const portfolioStats = useMemo(
    () => calculatePortfolioStats(assets, exchangeRate),
    [assets, exchangeRate]
  );

  // 벤치마크 데이터 가져오기
  const fetchBenchmarks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.BENCHMARK);
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data.benchmarks || []);
        setLastUpdated(data.timestamp);
      }
    } catch (error) {
      console.error('Failed to fetch benchmarks:', error);
      toast('벤치마크 데이터 로드 실패', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (assets.length > 0) {
      fetchBenchmarks();
    }
  }, [assets.length]);

  // 확장 시 데이터 새로고침
  useEffect(() => {
    if (isExpanded && benchmarks.length === 0) {
      fetchBenchmarks();
    }
  }, [isExpanded]);

  // 최고 수익률 (차트 스케일용)
  const maxReturn = useMemo(() => {
    const allReturns = [portfolioStats.returnPct, ...benchmarks.map(b => b.ytdReturn)];
    return Math.max(...allReturns.map(Math.abs), 10);
  }, [portfolioStats, benchmarks]);

  // 시장 대비 초과 수익률
  const alphaVsSP500 = portfolioStats.returnPct - (benchmarks.find(b => b.ticker === 'SPY')?.ytdReturn || 0);
  const alphaVsNasdaq = portfolioStats.returnPct - (benchmarks.find(b => b.ticker === 'QQQ')?.ytdReturn || 0);

  // 순위 계산
  const ranking = useMemo(() => {
    if (benchmarks.length === 0) return 1;
    
    const all = [
      { name: 'MY PORTFOLIO', return: portfolioStats.returnPct },
      ...benchmarks.map(b => ({ name: b.name, return: b.ytdReturn }))
    ].sort((a, b) => b.return - a.return);
    
    return all.findIndex(item => item.name === 'MY PORTFOLIO') + 1;
  }, [portfolioStats, benchmarks]);

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-5 border-accent-purple">
      {/* Header - Always Visible */}
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-display tracking-widest flex items-center gap-3 text-white">
          <i className="fas fa-trophy text-celestial-gold text-xs" />
          PERFORMANCE ARENA
          {isLoading && <i className="fas fa-spinner spinner text-xs opacity-50" />}
        </h2>

        {/* Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[11px]">
            <div>
              <span className="opacity-40 mr-2">YTD</span>
              <span className={portfolioStats.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                {portfolioStats.returnPct >= 0 ? '+' : ''}{portfolioStats.returnPct.toFixed(1)}%
              </span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="opacity-40 mr-2">vs S&P</span>
              <span className={alphaVsSP500 >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                {alphaVsSP500 >= 0 ? '+' : ''}{alphaVsSP500.toFixed(1)}%p
              </span>
            </div>
            <div className="border-l border-white/20 pl-4">
              <span className="opacity-40 mr-2">RANK</span>
              <span className="text-celestial-gold">#{ranking}/{benchmarks.length + 1}</span>
            </div>
          </div>
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs opacity-40`} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Bar Chart */}
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] opacity-40 tracking-widest">YTD RETURN COMPARISON</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); fetchBenchmarks(); }}
                  className="text-[9px] opacity-50 hover:opacity-80 flex items-center gap-1"
                >
                  <i className="fas fa-sync-alt" /> 새로고침
                </button>
              </div>
              
              {/* My Portfolio */}
              <div className="inner-glass p-3 rounded-lg border border-celestial-gold/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-display text-celestial-gold">MY PORTFOLIO</span>
                  <span className={`text-[12px] font-mono font-medium ${
                    portfolioStats.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'
                  }`}>
                    {portfolioStats.returnPct >= 0 ? '+' : ''}{portfolioStats.returnPct.toFixed(2)}%
                  </span>
                </div>
                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 h-full rounded-full transition-all ${
                      portfolioStats.returnPct >= 0 ? 'bg-gradient-to-r from-celestial-gold/50 to-celestial-gold' : 'bg-v64-danger'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (Math.abs(portfolioStats.returnPct) / maxReturn) * 100)}%`,
                      left: portfolioStats.returnPct >= 0 ? '0' : 'auto',
                      right: portfolioStats.returnPct < 0 ? '0' : 'auto',
                    }}
                  />
                </div>
              </div>

              {/* Benchmarks */}
              {benchmarks.length > 0 ? benchmarks.map((b) => (
                <div key={b.ticker} className="inner-glass p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-70">{b.name}</span>
                      <span className="text-[8px] opacity-40">({b.ticker})</span>
                    </div>
                    <span className={`text-[11px] font-mono ${
                      b.ytdReturn >= 0 ? 'text-v64-success' : 'text-v64-danger'
                    }`}>
                      {b.ytdReturn >= 0 ? '+' : ''}{b.ytdReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (Math.abs(b.ytdReturn) / maxReturn) * 100)}%`,
                        backgroundColor: b.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] opacity-40 mt-1">
                    <span>연초 ${b.yearStartPrice?.toFixed(2) || '---'}</span>
                    <span>현재 ${b.currentPrice?.toFixed(2) || '---'}</span>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 opacity-50">
                  <i className="fas fa-chart-bar text-2xl mb-2" />
                  <div className="text-[10px]">벤치마크 데이터 로딩 중...</div>
                </div>
              )}
            </div>

            {/* Right: Stats & Analysis */}
            <div className="space-y-4">
              {/* Alpha Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="inner-glass p-4 rounded-lg text-center">
                  <div className="text-[9px] opacity-40 tracking-widest mb-1">VS S&P 500</div>
                  <div className={`text-xl font-display ${
                    alphaVsSP500 >= 0 ? 'text-v64-success' : 'text-v64-danger'
                  }`}>
                    {alphaVsSP500 >= 0 ? '+' : ''}{alphaVsSP500.toFixed(1)}%p
                  </div>
                  <div className="text-[9px] opacity-50 mt-1">
                    {alphaVsSP500 >= 0 ? '🏆 시장 초과' : '📉 시장 하회'}
                  </div>
                </div>
                <div className="inner-glass p-4 rounded-lg text-center">
                  <div className="text-[9px] opacity-40 tracking-widest mb-1">VS NASDAQ</div>
                  <div className={`text-xl font-display ${
                    alphaVsNasdaq >= 0 ? 'text-v64-success' : 'text-v64-danger'
                  }`}>
                    {alphaVsNasdaq >= 0 ? '+' : ''}{alphaVsNasdaq.toFixed(1)}%p
                  </div>
                  <div className="text-[9px] opacity-50 mt-1">
                    {alphaVsNasdaq >= 0 ? '🏆 기술주 초과' : '📉 기술주 하회'}
                  </div>
                </div>
              </div>

              {/* Ranking Badge */}
              <div className="inner-glass p-4 rounded-lg border border-celestial-purple/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-celestial-purple tracking-widest mb-1">CURRENT RANKING</div>
                    <div className="text-2xl font-display text-white">
                      #{ranking} <span className="text-sm opacity-40">/ {benchmarks.length + 1}</span>
                    </div>
                  </div>
                  <div className="text-4xl">
                    {ranking === 1 ? '🥇' : ranking === 2 ? '🥈' : ranking === 3 ? '🥉' : '📊'}
                  </div>
                </div>
                <div className="text-[10px] opacity-50 mt-2">
                  {ranking === 1 && '축하합니다! 모든 벤치마크를 상회하고 있습니다.'}
                  {ranking === 2 && '우수한 성과! 대부분의 벤치마크를 상회합니다.'}
                  {ranking === 3 && '양호한 성과를 보이고 있습니다.'}
                  {ranking > 3 && '벤치마크 대비 수익률 개선이 필요합니다.'}
                </div>
              </div>

              {/* Last Updated */}
              {lastUpdated && (
                <div className="text-[8px] opacity-30 text-center">
                  * {new Date().getFullYear()}년 YTD 실시간 데이터 | 
                  업데이트: {new Date(lastUpdated).toLocaleTimeString('ko-KR')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
