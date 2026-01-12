'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { getMarketStateInfo, isDST, MarketState } from '@/lib/utils';
import { Asset } from '@/lib/types'; // Asset 타입 import 필요

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenFreedom: () => void;
}

export default function Header({ onOpenSettings, onOpenAuth, onOpenFreedom }: HeaderProps) {
  const { state, refreshPrices, toast } = useNexus();
  const [clock, setClock] = useState('--:--');
  const [isLive, setIsLive] = useState(false);
  const [syncTime, setSyncTime] = useState('--');
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'loading' | 'online'>('offline');
  const [user, setUser] = useState<any>(null);
  
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Auth 상태 체크
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update sync time
  useEffect(() => {
    if (state.lastSync) {
      const updateSyncTime = () => {
        const diff = Date.now() - state.lastSync!;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setSyncTime(minutes > 0 ? `${minutes}분 전` : `${seconds}초 전`);
      };
      updateSyncTime();
      const interval = setInterval(updateSyncTime, 1000);
      return () => clearInterval(interval);
    }
  }, [state.lastSync]);

  // Refresh prices with status update
  const handleRefresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setConnectionStatus('loading');
    
    try {
      await refreshPrices();
      setConnectionStatus('online');
      toast('SYNCHRONIZED', 'success');
    } catch {
      setConnectionStatus('offline');
      toast('SYNC FAILED', 'danger');
    } finally {
      isFetchingRef.current = false;
    }
  }, [refreshPrices, toast]);

  // Toggle Live mode
  const toggleLive = useCallback(() => {
    if (isLive) {
      // Disconnect
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      setIsLive(false);
      setConnectionStatus('offline');
      toast('DISCONNECTED', 'info');
    } else {
      // Connect
      setIsLive(true);
      toast('CONNECTING...', 'info');
      
      // Initial fetch
      handleRefresh();
      
      // Set interval
      const refreshInterval = parseInt(localStorage.getItem('nexus_refresh_interval') || '5') * 60 * 1000;
      liveIntervalRef.current = setInterval(handleRefresh, refreshInterval);
    }
  }, [isLive, handleRefresh, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
  }, []);

  // Calculate totals - 메모이제이션
  const portfolioStats = useMemo(() => {
    let totalCost = 0, totalValue = 0, totalCostKrw = 0, totalValueKrw = 0;
    state.assets.forEach(a => {
      const cost = a.qty * a.avg;
      const value = a.qty * a.price;
      const buyRate = a.buyRate || state.exchangeRate;
      totalCost += cost;
      totalValue += value;
      totalCostKrw += Math.round(cost * buyRate);
      totalValueKrw += Math.round(value * state.exchangeRate);
    });

    const returnVal = totalValue - totalCost;
    const returnKrw = totalValueKrw - totalCostKrw;
    const sign = returnVal >= 0 ? '+' : '';
    const signKrw = returnKrw >= 0 ? '+' : '';
    const colorClass = returnVal >= 0 ? 'text-v64-success glow-success' : 'text-v64-danger glow-danger';
    const colorClassKrw = returnKrw >= 0 ? 'text-v64-success glow-success' : 'text-v64-danger glow-danger';

    return {
      totalCost,
      totalValue,
      totalCostKrw,
      totalValueKrw,
      returnVal,
      returnKrw,
      sign,
      signKrw,
      colorClass,
      colorClassKrw,
    };
  }, [state.assets, state.exchangeRate]);

  // VIX Level 계산 - 메모이제이션
  const vixStats = useMemo(() => {
    const vix = state.market.vix || 15;
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
  }, [state.market.vix]);

  // Market state 정보 - 메모이제이션
  const marketInfo = useMemo(() => {
    const marketState = (state.market.marketState || 'CLOSED') as MarketState;
    return getMarketStateInfo(marketState);
  }, [state.market.marketState]);

  const dstActive = useMemo(() => isDST(), []);

  // ═══════════════════════════════════════════════════════════════
  // EXPORT FUNCTION (Refactored with FreedomModal Logic)
  // ═══════════════════════════════════════════════════════════════
  const handleExportFreedom = () => {
    // 1. 그룹 분석 함수 (FreedomModal과 동일 로직)
    const groupBy = (assets: Asset[], key: 'sector' | 'type') => {
      const groups: Record<string, { value: number; cost: number; count: number }> = {};
      assets.forEach(a => {
        const groupKey = a[key] || 'Other';
        if (!groups[groupKey]) groups[groupKey] = { value: 0, cost: 0, count: 0 };
        groups[groupKey].value += a.price * a.qty;
        groups[groupKey].cost += a.avg * a.qty;
        groups[groupKey].count += 1;
      });
      return Object.entries(groups).map(([name, data]) => ({
        name,
        weight: portfolioStats.totalValue > 0 ? (data.value / portfolioStats.totalValue * 100).toFixed(1) + '%' : '0%',
        returnPct: data.cost > 0 ? ((data.value - data.cost) / data.cost * 100).toFixed(2) + '%' : '0%',
        valueUsd: Math.round(data.value),
        assetCount: data.count
      })).sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
    };

    // 2. 그룹 데이터 생성
    const sectorStats = groupBy(state.assets, 'sector');
    const typeStats = groupBy(state.assets, 'type');

    // 3. 배당 데이터 분석
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const recentDividends = state.dividends.filter(d => new Date(d.date) >= oneYearAgo);
    const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + (d.qty * d.dps), 0);
    
    // 4. 자산 상세 데이터
    const assetsData = state.assets.map(a => {
      const value = a.qty * a.price;
      const weight = portfolioStats.totalValue > 0 ? (value / portfolioStats.totalValue * 100).toFixed(2) + '%' : '0%';
      return {
        ticker: a.ticker,
        type: a.type,
        sector: a.sector,
        qty: a.qty,
        avg: a.avg,
        price: a.price,
        value: Number(value.toFixed(2)),
        weight: weight,
        returnPct: a.avg > 0 ? ((a.price - a.avg) / a.avg * 100).toFixed(2) + '%' : '0%',
      };
    });

    // 5. 실현 손익
    const totalRealizedPL = Object.values(state.tradeSums).reduce((acc, val) => acc + val, 0);

    // 6. 타임라인 (최근 30일 추세)
    const recentTrend = state.timeline.slice(-30).map(t => ({
      date: t.date,
      value: Math.round(t.value),
      returnPct: t.cost > 0 ? ((t.value - t.cost) / t.cost * 100).toFixed(2) : 0
    }));

    // 7. 최종 JSON 구성 (External AI Prompt Ready)
    const data = {
      meta: {
        timestamp: new Date().toISOString(),
        platform: "NEXUS Dashboard V65.1",
        userStrategy: state.strategy || 'Unspecified',
      },
      summary: {
        totalValue: Number(portfolioStats.totalValue.toFixed(2)),
        totalCost: Number(portfolioStats.totalCost.toFixed(2)),
        totalRealizedPL: Number(totalRealizedPL.toFixed(2)),
        unrealizedReturnPct: portfolioStats.totalCost > 0 ? Number(((portfolioStats.totalValue - portfolioStats.totalCost) / portfolioStats.totalCost * 100).toFixed(2)) + '%' : '0%',
        exchangeRate: state.exchangeRate,
        cashHoldings: 0,
      },
      groups: {
        bySector: sectorStats,
        byType: typeStats,
      },
      income: {
        annualTotal: Number(totalAnnualDividend.toFixed(2)),
        payingAssetsCount: new Set(recentDividends.map(d => d.ticker)).size,
      },
      history: {
        recentTrend: recentTrend,
      },
      assets: assetsData,
      market: state.market,
    };
    
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast('상세 분석 데이터 복사됨', 'success');
  };

  const formatUSD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <header className="glass-card p-5">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <i className="fas fa-infinity text-xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-[0.2em] font-display text-white text-glow">CELESTIAL</h1>
            <div className="text-[10px] tracking-[0.3em] opacity-90 mt-1">NEXUS INTELLIGENCE V1.0</div>
          </div>
        </div>

        {/* Total Assets - 평가금(수익금), 원금 순 */}
        <div className="flex items-center gap-6 px-6 border-l border-white/10">
          {/* USD */}
          <div className="text-center">
            <div className="text-[8px] uppercase tracking-widest mb-1 opacity-80">평가금($)</div>
            <div className="text-2xl font-light tracking-tight text-gradient-cyan">{formatUSD(portfolioStats.totalValue)}</div>
            <div className={`text-[10px] mt-0.5 ${portfolioStats.colorClass}`}>({portfolioStats.sign}{formatUSD(Math.abs(portfolioStats.returnVal))})</div>
            <div className="text-[9px] mt-1 opacity-80">원금: {formatUSD(portfolioStats.totalCost)}</div>
          </div>
          {/* KRW */}
          <div className="text-center">
            <div className="text-[8px] uppercase tracking-widest mb-1 opacity-80">평가금(₩)</div>
            <div className="text-2xl font-light tracking-tight text-gradient-gold">₩{portfolioStats.totalValueKrw.toLocaleString()}</div>
            <div className={`text-[10px] mt-0.5 ${portfolioStats.colorClassKrw}`}>({portfolioStats.signKrw}₩{Math.abs(portfolioStats.returnKrw).toLocaleString()})</div>
            <div className="text-[9px] mt-1 opacity-80">원금: ₩{portfolioStats.totalCostKrw.toLocaleString()}</div>
          </div>
        </div>

        {/* Market Indices - 2x2 그리드 + VIX + Market State */}
        <div className="flex gap-3 px-6 border-l border-r border-white/15">
          {/* Market State Badge */}
          <div className="flex flex-col justify-center items-center min-w-[85px]">
            {(() => {

              const stateColors = {
                green: 'bg-v64-success/20 text-v64-success border border-v64-success/30',
                blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
                orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
                gray: 'bg-white/10 text-white/50 border border-white/20',
              };

              return (
                <>
                  <div className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider ${stateColors[marketInfo.color as keyof typeof stateColors]}`}>
                    {marketInfo.label}
                  </div>
                  <span className="text-[7px] opacity-80 mt-1">KST {marketInfo.time}</span>
                  <span className={`text-[6px] mt-0.5 ${dstActive ? 'text-celestial-gold' : 'text-white/30'}`}>
                    {dstActive ? '☀️ DST' : '❄️ STD'}
                  </span>
                </>
              );
            })()}
          </div>

          {/* 2x2 Grid: NASDAQ/S&P500, USD/KRW/US10Y */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {/* Row 1 */}
            <div className="flex items-center justify-between gap-3 min-w-[110px]">
              <span className="text-[9px] tracking-widest text-blue-400/80">NASDAQ</span>
              <span className="text-sm font-display text-blue-400">
                {state.market.nasdaq ? state.market.nasdaq.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 min-w-[100px]">
              <span className="text-[9px] tracking-widest text-white/60">USD/KRW</span>
              <span className="text-sm font-display text-white">
                ₩{state.exchangeRate.toLocaleString()}
              </span>
            </div>
            {/* Row 2 */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] tracking-widest text-emerald-400/80">S&P 500</span>
              <span className="text-sm font-display text-emerald-400">
                {state.market.sp500 ? state.market.sp500.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '---'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[9px] tracking-widest text-celestial-gold/80">US 10Y</span>
              <span className="text-sm font-display text-celestial-gold">
                {state.market.tnx ? state.market.tnx.toFixed(2) + '%' : '---'}
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

        {/* Controls */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            {/* Auth Status */}
            {user ? (
              <div className="flex items-center gap-2">
                <i className="fas fa-user-check text-v64-success text-[10px]" />
                <span className="text-[9px] text-v64-success">{user.email?.split('@')[0]}</span>
              </div>
            ) : (
              <span className="text-[9px] opacity-80">Guest</span>
            )}
            <span className={`status-dot ${connectionStatus}`} />
            <span className="text-[10px] tracking-widest font-light opacity-90">
              {connectionStatus === 'loading' ? 'SYNC...' : connectionStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="text-[9px] opacity-80">{syncTime}</span>
            <div className="text-lg font-display font-light w-20 text-center">{clock}</div>
          </div>
          <div className="flex gap-1.5">
            {/* Auth Button */}
            {user ? (
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast('로그아웃 되었습니다', 'info');
                }}
                className="celestial-btn text-[9px]"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="celestial-btn text-[9px]"
                title="Login"
              >
                <i className="fas fa-user" />
              </button>
            )}
            <button
              onClick={toggleLive}
              className={`celestial-btn text-[9px] ${isLive ? 'border-v64-success/40 text-v64-success' : ''}`}
            >
              {isLive ? 'DISCONNECT' : 'CONNECT'}
            </button>
            <button
              onClick={handleExportFreedom}
              className="celestial-btn text-[9px]"
              title="Export to Clipboard"
            >
              <i className="fas fa-copy" />
            </button>
            <button
              onClick={onOpenFreedom}
              className="celestial-btn celestial-btn-gold text-[9px]"
              title="Freedom AI Analysis"
            >
              <i className="fas fa-robot mr-1" />AI
            </button>
            <button
              onClick={onOpenSettings}
              className="celestial-btn text-[9px]"
            >
              <i className="fas fa-cog" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
