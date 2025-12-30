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
    const data = {
      timestamp: new Date().toISOString(),
      totalValue,
      totalCost,
      returnPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0,
      exchangeRate: state.exchangeRate,
      assets: state.assets.map(a => ({
        ticker: a.ticker,
        qty: a.qty,
        avg: a.avg,
        price: a.price,
        value: a.qty * a.price,
        returnPct: a.avg > 0 ? ((a.price - a.avg) / a.avg * 100).toFixed(2) : 0,
        type: a.type,
        sector: a.sector,
      })),
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
            <div className="text-[10px] tracking-[0.3em] opacity-60 mt-1">NEXUS INTELLIGENCE V64.2</div>
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

        {/* Market Indices - 2x2 그리드 + VIX */}
        <div className="flex gap-3 px-6 border-l border-r border-white/15">
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
