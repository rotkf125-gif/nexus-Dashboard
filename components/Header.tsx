'use client';

// ═══════════════════════════════════════════════════════════════
// Header - 2-Row Layout (v1.8.5)
// Row1: 로고 | 마켓 데이터 | 커넥트 로그인 설정
// Row2: 시간 | 포트폴리오  | 경과시간 Export AI
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { getMarketStateInfo, MarketState } from '@/lib/utils';
import UndoRedoIndicator from './UndoRedoIndicator';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenFreedom: () => void;
  onOpenExport: () => void;
}

export default function Header({ onOpenSettings, onOpenAuth, onOpenFreedom, onOpenExport }: HeaderProps) {
  const { state, refreshPrices, toast } = useNexus();
  const [clock, setClock] = useState('--:--');
  const [isLive, setIsLive] = useState(false);
  const [syncTime, setSyncTime] = useState('--');
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'loading' | 'online'>('offline');
  const [user, setUser] = useState<any>(null);

  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.lastSync) {
      const updateSyncTime = () => {
        const diff = Date.now() - state.lastSync!;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setSyncTime(minutes > 0 ? `${minutes}m` : `${seconds}s`);
      };
      updateSyncTime();
      const interval = setInterval(updateSyncTime, 1000);
      return () => clearInterval(interval);
    }
  }, [state.lastSync]);

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

  const toggleLive = useCallback(() => {
    if (isLive) {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
      setIsLive(false);
      setConnectionStatus('offline');
      toast('DISCONNECTED', 'info');
    } else {
      setIsLive(true);
      toast('CONNECTING...', 'info');
      handleRefresh();
      const refreshInterval = parseInt(localStorage.getItem('nexus_refresh_interval') || '5') * 60 * 1000;
      liveIntervalRef.current = setInterval(handleRefresh, refreshInterval);
    }
  }, [isLive, handleRefresh, toast]);

  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []);

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
    const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    return { totalCost, totalValue, totalCostKrw, totalValueKrw, returnVal: totalValue - totalCost, returnKrw: totalValueKrw - totalCostKrw, returnPct };
  }, [state.assets, state.exchangeRate]);

  const vixStats = useMemo(() => {
    const vix = state.market.vix || 15;
    let vixColor = 'text-v64-success';
    if (vix > 35) vixColor = 'text-v64-danger';
    else if (vix > 25) vixColor = 'text-yellow-400';
    return { vix, vixColor };
  }, [state.market.vix]);

  const marketInfo = useMemo(() => {
    const marketState = (state.market.marketState || 'CLOSED') as MarketState;
    return getMarketStateInfo(marketState);
  }, [state.market.marketState]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast('로그아웃 되었습니다', 'info');
  };

  const formatUSD = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const formatKRW = (n: number) => '₩' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const stateColors: Record<string, string> = {
    green: 'bg-v64-success/20 text-v64-success border-v64-success/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    gray: 'bg-white/10 text-white/70 border-white/20',
  };

  const plColor = portfolioStats.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger';
  const plColorKrw = portfolioStats.returnKrw >= 0 ? 'text-v64-success' : 'text-v64-danger';

  return (
    <header className="glass-card px-4 py-2">
      <div className="flex items-stretch">
        {/* ═══ LEFT: LOGO + TIME ═══ */}
        <div className="flex flex-col justify-center items-center gap-0.5 flex-shrink-0 pr-3 border-r border-white/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
              <i className="fas fa-infinity text-base text-white" />
            </div>
            <div className="text-base font-bold tracking-wider font-display text-white">NEXUS</div>
          </div>
          <span className="text-sm font-display text-white/70">{clock}</span>
        </div>

        {/* ═══ CENTER: MARKET + PORTFOLIO ═══ */}
        <div className="flex-1 flex flex-col mx-3 gap-1.5">
          {/* Row 1: Market Data (with border box) */}
          <div className={`flex items-center justify-center gap-4 px-4 py-1 rounded-lg border ${stateColors[marketInfo.color]}`}>
            <span className="text-xs font-medium tracking-wider">{marketInfo.label}</span>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-blue-400/70">NDX</span>
              <span className="text-sm font-display text-blue-400">
                {state.market.nasdaq ? (state.market.nasdaq / 1000).toFixed(1) + 'K' : '--'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-emerald-400/70">S&P</span>
              <span className="text-sm font-display text-emerald-400">
                {state.market.sp500 ? state.market.sp500.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '--'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-v64-danger/70">VIX</span>
              <span className={`text-sm font-display font-medium ${vixStats.vixColor}`}>{vixStats.vix.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-white">₩</span>
              <span className="text-sm font-display text-white">{state.exchangeRate.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-celestial-gold/70">US10Y</span>
              <span className="text-sm font-display text-celestial-gold">{state.market.tnx ? state.market.tnx.toFixed(2) + '%' : '--'}</span>
            </div>
          </div>

          {/* Row 2: Portfolio (no border) */}
          <div className="flex items-center justify-center gap-3 px-4">
            {/* USD */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white">평가</span>
              <span className="text-sm font-display text-celestial-cyan">{formatUSD(portfolioStats.totalValue)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white">원금</span>
              <span className="text-sm text-white">{formatUSD(portfolioStats.totalCost)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white">수익</span>
              <span className={`text-sm ${plColor}`}>
                {portfolioStats.returnVal >= 0 ? '+' : ''}{formatUSD(portfolioStats.returnVal)}
                <span className="ml-1">({portfolioStats.returnPct >= 0 ? '+' : ''}{portfolioStats.returnPct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="w-px h-4 bg-white/15" />
            {/* KRW */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white">평가</span>
              <span className="text-sm font-display text-celestial-gold">{formatKRW(portfolioStats.totalValueKrw)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white">원금</span>
              <span className="text-sm text-white">{formatKRW(portfolioStats.totalCostKrw)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-white">수익</span>
              <span className={`text-sm ${plColorKrw}`}>
                {portfolioStats.returnKrw >= 0 ? '+' : ''}{formatKRW(portfolioStats.returnKrw)}
              </span>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: CONTROLS ═══ */}
        <div className="flex flex-col justify-center gap-1 flex-shrink-0 pl-3 border-l border-white/20">
          {/* Row 1: Connect Login Settings */}
          <div className="flex items-center gap-1">
            <button onClick={toggleLive} className={`header-btn-compact ${isLive ? 'text-v64-success border-v64-success/40' : ''}`}>
              <i className={`fas fa-${isLive ? 'link' : 'unlink'}`} /><span>{isLive ? 'Live' : 'Connect'}</span>
            </button>
            {user ? (
              <button onClick={handleLogout} className="header-btn-compact"><i className="fas fa-sign-out-alt" /><span>Logout</span></button>
            ) : (
              <button onClick={onOpenAuth} className="header-btn-compact"><i className="fas fa-user" /><span>Login</span></button>
            )}
            <button onClick={onOpenSettings} className="header-btn-compact"><i className="fas fa-cog" /></button>
          </div>
          {/* Row 2: SyncTime Export AI */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 px-2">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'online' ? 'bg-v64-success' : connectionStatus === 'loading' ? 'bg-yellow-400 animate-pulse' : 'bg-white/40'}`} />
              <span className="text-xs text-white/60">{syncTime}</span>
            </div>
            <UndoRedoIndicator />
            <button onClick={onOpenExport} className="header-btn-compact"><i className="fas fa-download" /><span>Export</span></button>
            <button onClick={onOpenFreedom} className="header-btn-compact-gold"><i className="fas fa-robot" /><span>AI</span></button>
          </div>
        </div>
      </div>
    </header>
  );
}
