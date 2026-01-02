'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNexus } from '@/lib/context';
import { supabase, getCurrentUserId } from '@/lib/supabase';
import AuthModal from './AuthModal';

interface HeaderProps {
  onOpenSettings: () => void;
}

export default function Header({ onOpenSettings }: HeaderProps) {
  const { state, refreshPrices, toast } = useNexus();
  const [clock, setClock] = useState('--:--');
  const [isLive, setIsLive] = useState(false);
  const [syncTime, setSyncTime] = useState('--');
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'loading' | 'online'>('offline');
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  // Calculate totals
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

  // VIX Level
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

  const handleToggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) {
      toast('실시간 모드 활성화', 'success');
    } else {
      toast('실시간 모드 비활성화', 'info');
    }
  };

  const handleExportFreedom = () => {
    // Assets 배열 (전체 자산)
    const assetsData = state.assets.map(a => {
      const value = a.qty * a.price;
      const buyRate = a.buyRate || state.exchangeRate;
      const valueKrw = Math.round(value * state.exchangeRate);
      const fxPL = Math.round(value * (state.exchangeRate - buyRate));
      
      return {
        ticker: a.ticker,
        qty: a.qty,
        avg: a.avg,
        price: a.price,
        valueUsd: Number((value).toFixed(2)),
        valueKrw: valueKrw,
        fxRate: buyRate,
        fxPL: fxPL,
        type: a.type,
        sector: a.sector,
      };
    });

    // Income Stream 배열 (INCOME 타입만)
    const incomeAssets = state.assets.filter(a => a.type === 'INCOME');
    const incomeStreamData = incomeAssets.map(asset => {
      const tickerDividends = state.dividends.filter(d => d.ticker === asset.ticker);
      
      // 총 배당금 (세후 15%)
      const totalDividend = tickerDividends.reduce((sum, d) => {
        const gross = d.qty * d.dps;
        return sum + gross * 0.85;
      }, 0);

      // 원금 / 평가금
      const principal = asset.qty * asset.avg;
      const valuation = asset.qty * asset.price;
      const unrealizedPL = valuation - principal;

      // Trade Return
      const tradeReturn = state.tradeSums[asset.ticker] ?? 0;

      // Total Return = Trade + 미실현 + 배당
      const totalReturn = tradeReturn + unrealizedPL + totalDividend;

      // Recovery %
      const recoveryPct = principal > 0 ? (totalDividend / principal) * 100 : 0;

      // 배당 예측 (최근 6개 기반)
      const dpsHistory = tickerDividends
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6)
        .map(d => d.dps);
      
      const avgDps = dpsHistory.length > 0 
        ? dpsHistory.reduce((sum, d) => sum + d, 0) / dpsHistory.length 
        : 0;

      return {
        ticker: asset.ticker,
        principal: Number(principal.toFixed(2)),
        dividend: Number(totalDividend.toFixed(2)),
        valuation: Number(valuation.toFixed(2)),
        tradeReturn: Number(tradeReturn.toFixed(2)),
        totalReturn: Number(totalReturn.toFixed(2)),
        recoveryPct: Number(recoveryPct.toFixed(1)),
        predictedDps: Number(avgDps.toFixed(2)),
        dividendCount: tickerDividends.length,
      };
    });

    // 주간 배당 통계 (2025-10-23 이후)
    const startDate = new Date('2025-10-23');
    const now = new Date();
    const weeksSinceStart = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    const recentDividends = state.dividends.filter(d => new Date(d.date) >= startDate);
    const totalAfterTax = recentDividends.reduce((sum, d) => sum + d.qty * d.dps * 0.85, 0);
    const weeklyAvg = totalAfterTax / weeksSinceStart;

    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        totalValue: Number(totalValue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        returnPct: totalCost > 0 ? Number(((totalValue - totalCost) / totalCost * 100).toFixed(2)) : 0,
        totalValueKrw: Math.round(totalValue * state.exchangeRate),
        exchangeRate: state.exchangeRate,
      },
      assets: assetsData,
      incomeStream: {
        assets: incomeStreamData,
        weeklyAvg: Number(weeklyAvg.toFixed(2)),
        totalDividend: Number(incomeStreamData.reduce((sum, a) => sum + a.dividend, 0).toFixed(2)),
      },
      market: state.market,
    };
    
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast('Freedom 데이터 복사됨', 'success');
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
            <div className="text-[10px] tracking-[0.3em] opacity-60 mt-1">NEXUS INTELLIGENCE V65.0</div>
          </div>
        </div>

        {/* Total Assets - 평가금(수익금), 원금 순 */}
        <div className="flex items-center gap-6 px-6 border-l border-white/10">
          {/* USD */}
          <div className="text-center">
            <div className="text-[8px] uppercase tracking-widest mb-1 opacity-50">평가금($)</div>
            <div className="text-2xl font-light tracking-tight text-gradient-cyan">{formatUSD(totalValue)}</div>
            <div className={`text-[10px] mt-0.5 ${colorClass}`}>({sign}{formatUSD(Math.abs(returnVal))})</div>
            <div className="text-[9px] mt-1 opacity-40">원금: {formatUSD(totalCost)}</div>
          </div>
          {/* KRW */}
          <div className="text-center">
            <div className="text-[8px] uppercase tracking-widest mb-1 opacity-50">평가금(₩)</div>
            <div className="text-2xl font-light tracking-tight text-gradient-gold">₩{totalValueKrw.toLocaleString()}</div>
            <div className={`text-[10px] mt-0.5 ${colorClassKrw}`}>({signKrw}₩{Math.abs(returnKrw).toLocaleString()})</div>
            <div className="text-[9px] mt-1 opacity-40">원금: ₩{totalCostKrw.toLocaleString()}</div>
          </div>
        </div>

        {/* Market Indices - 2x2 그리드 + VIX + Market State */}
        <div className="flex gap-3 px-6 border-l border-r border-white/15">
          {/* Market State Badge */}
          <div className="flex flex-col justify-center items-center min-w-[85px]">
            {(() => {
              // 서머타임 체크 (3월 둘째 일요일 ~ 11월 첫째 일요일)
              const now = new Date();
              const year = now.getFullYear();
              const marchSecondSunday = new Date(year, 2, 8 + (7 - new Date(year, 2, 1).getDay()) % 7);
              const novFirstSunday = new Date(year, 10, 1 + (7 - new Date(year, 10, 1).getDay()) % 7);
              const isDST = now >= marchSecondSunday && now < novFirstSunday;
              
              // 한국 시간 (KST = UTC+9)
              const kstHour = now.getUTCHours() + 9;
              const kstHourNormalized = kstHour >= 24 ? kstHour - 24 : kstHour;
              const kstDay = now.getUTCDay(); // 0=일, 6=토
              const isWeekend = kstDay === 0 || kstDay === 6;
              
              // 한국 주간 거래 시간 (평일 10:00~17:00 KST)
              const isKoreanDayTrading = !isWeekend && kstHourNormalized >= 10 && kstHourNormalized < 17;
              
              // 한국 시간 기준 거래 시간 (서머타임 적용)
              const marketTimes = isDST ? {
                pre: '17:00-22:30',
                regular: '22:30-05:00',
                post: '05:00-07:00',
                day: '10:00-17:00',
              } : {
                pre: '18:00-23:30',
                regular: '23:30-06:00',
                post: '06:00-08:00',
                day: '10:00-17:00',
              };

              // API에서 받은 marketState
              const apiState = state.market.marketState;
              
              // 표시할 상태 및 시간
              let displayState = apiState;
              let displayTime = '---';
              
              if (apiState === 'REGULAR') {
                displayTime = marketTimes.regular;
              } else if (apiState === 'PRE') {
                displayTime = marketTimes.pre;
              } else if (apiState === 'POST') {
                displayTime = marketTimes.post;
              } else if (isKoreanDayTrading) {
                displayState = 'DAY';
                displayTime = marketTimes.day;
              }

              return (
                <>
                  <div className={`px-2 py-1 rounded text-[9px] font-medium tracking-wider ${
                    displayState === 'REGULAR' 
                      ? 'bg-v64-success/20 text-v64-success border border-v64-success/30' 
                      : displayState === 'PRE'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : displayState === 'POST'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : displayState === 'DAY'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-white/10 text-white/50 border border-white/20'
                  }`}>
                    {displayState === 'REGULAR' && '🟢 정규장'}
                    {displayState === 'PRE' && '🔵 프리마켓'}
                    {displayState === 'POST' && '🟣 애프터'}
                    {displayState === 'DAY' && '🟠 주간거래'}
                    {displayState === 'CLOSED' && '⚫ 휴장'}
                    {!displayState && '⚫ ---'}
                  </div>
                  <span className="text-[7px] opacity-50 mt-1">KST {displayTime}</span>
                  <span className={`text-[6px] mt-0.5 ${isDST ? 'text-celestial-gold' : 'text-white/30'}`}>
                    {isDST ? '☀️ DST' : '❄️ STD'}
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
                {vix.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-[3px] bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${vixBarColor}`}
                  style={{ width: `${vixBarWidth}%` }}
                />
              </div>
              <span className="text-[8px] opacity-60">{vixLevel}</span>
            </div>
            <span className="text-[8px] text-celestial-gold/80 font-light block text-right">
              {vixAction}
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
              <span className="text-[9px] opacity-40">Guest</span>
            )}
            <span className={`status-dot ${connectionStatus}`} />
            <span className="text-[10px] tracking-widest font-light opacity-60">
              {connectionStatus === 'loading' ? 'SYNC...' : connectionStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
            </span>
            <span className="text-[9px] opacity-40">{syncTime}</span>
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
                onClick={() => setAuthModalOpen(true)}
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
              className="celestial-btn celestial-btn-gold text-[9px]"
              title="Freedom v30"
            >
              <i className="fas fa-bolt mr-1" />FREEDOM
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthChange={setUser}
      />
    </header>
  );
}
