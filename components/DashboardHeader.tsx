'use client';

// ═══════════════════════════════════════════════════════════════
// DASHBOARD HEADER - 통합 헤더 (Header + Strategy + Alerts)
// 좌측 70%: Header + StrategyBar
// 우측 30%: PortfolioHealthAlert
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { getMarketStateInfo, MarketState } from '@/lib/utils';
import { SECTORS } from '@/lib/config';
import { ETF_SECTOR_DATA } from '@/lib/market-data';

interface DashboardHeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenFreedom: () => void;
  onOpenExport: () => void;
}

interface HealthAlert {
  type: 'concentration' | 'sector' | 'vix';
  severity: 'warning' | 'danger';
  title: string;
  message: string;
  value: number;
  threshold: number;
}

export default function DashboardHeader({ onOpenSettings, onOpenAuth, onOpenFreedom, onOpenExport }: DashboardHeaderProps) {
  const { state, refreshPrices, toast, setStrategy } = useNexus();
  const { assets, market } = state;

  // Header States
  const [clock, setClock] = useState('--:--');
  const [isLive, setIsLive] = useState(false);
  const [syncTime, setSyncTime] = useState('--');
  const [connectionStatus, setConnectionStatus] = useState<'offline' | 'loading' | 'online'>('offline');
  const [user, setUser] = useState<any>(null);
  const liveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Strategy States
  const [localStrategy, setLocalStrategy] = useState('');
  const [saved, setSaved] = useState(false);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Time
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

  // Strategy
  useEffect(() => {
    setLocalStrategy(state.strategy || '');
  }, [state.strategy]);

  const handleStrategyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalStrategy(value);
    setStrategy(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [setStrategy]);

  // Refresh
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

  // Portfolio Stats
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

  // VIX Stats
  const vixStats = useMemo(() => {
    const vix = state.market.vix || 15;
    let vixColor = 'text-v64-success';
    if (vix > 35) vixColor = 'text-v64-danger';
    else if (vix > 25) vixColor = 'text-yellow-400';
    return { vix, vixColor };
  }, [state.market.vix]);

  // Market Info
  const marketInfo = useMemo(() => {
    const marketState = (state.market.marketState || 'CLOSED') as MarketState;
    return getMarketStateInfo(marketState);
  }, [state.market.marketState]);

  // Health Alerts
  const alerts = useMemo((): HealthAlert[] => {
    if (assets.length === 0) return [];
    const alertList: HealthAlert[] = [];
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return [];

    // 단일 자산 집중도
    assets.forEach(asset => {
      const weight = (asset.qty * asset.price) / totalValue;
      if (weight >= 0.30) {
        alertList.push({
          type: 'concentration',
          severity: weight >= 0.40 ? 'danger' : 'warning',
          title: '집중 위험',
          message: `${asset.ticker} ${(weight * 100).toFixed(1)}%`,
          value: weight * 100,
          threshold: 30,
        });
      }
    });

    // 섹터 편중
    const sectorWeights: Record<string, number> = {};
    assets.forEach(asset => {
      const assetWeight = (asset.qty * asset.price) / totalValue;
      const etfSectors = ETF_SECTOR_DATA[asset.ticker];
      if (etfSectors) {
        Object.entries(etfSectors).forEach(([sector, weight]) => {
          sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight * weight;
        });
      } else {
        const sector = asset.sector || 'Other';
        sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight;
      }
    });

    Object.entries(sectorWeights).forEach(([sector, weight]) => {
      if (weight >= 0.60) {
        const sectorInfo = SECTORS[sector] || SECTORS.Other;
        alertList.push({
          type: 'sector',
          severity: weight >= 0.70 ? 'danger' : 'warning',
          title: '섹터 편중',
          message: `${sectorInfo.emoji} ${sectorInfo.label} ${(weight * 100).toFixed(1)}%`,
          value: weight * 100,
          threshold: 60,
        });
      }
    });

    // VIX 경고
    if (market.vix && market.vix > 25) {
      alertList.push({
        type: 'vix',
        severity: market.vix >= 35 ? 'danger' : 'warning',
        title: 'VIX 경고',
        message: `VIX ${market.vix.toFixed(1)} - 변동성 주의`,
        value: market.vix,
        threshold: 25,
      });
    }

    return alertList;
  }, [assets, market.vix]);

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
    <div className="flex items-stretch gap-3">
      {/* ═══ LEFT 80%: Header + Strategy ═══ */}
      <div className="flex-[8] flex flex-col gap-2">
        {/* Header */}
        <header className="glass-card px-4 py-2">
          <div className="flex items-stretch">
            {/* LEFT: LOGO + TIME */}
            <div className="flex flex-col justify-center items-center gap-0.5 flex-shrink-0 pr-3 border-r border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 border border-white/30 rounded-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
                  <i className="fas fa-infinity text-base text-white" />
                </div>
                <div className="text-base font-bold tracking-wider font-display text-white">NEXUS</div>
              </div>
              <span className="text-sm font-display font-bold text-white/70">{clock}</span>
            </div>

            {/* CENTER: PORTFOLIO (LEFT) + MARKET (RIGHT) */}
            <div className="flex-1 flex mx-3 gap-3">
              {/* LEFT: Portfolio */}
              <div className="flex-[6] inner-glass rounded-lg px-4 py-2 flex flex-col justify-center gap-1 min-w-[450px]">
                {/* USD Row */}
                <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
                  <span className="text-xs text-white font-bold w-8 flex-shrink-0">USD</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-white/70 font-bold">평가</span>
                    <span className="text-base font-display font-bold text-celestial-cyan">{formatUSD(portfolioStats.totalValue)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-white/70 font-bold">원금</span>
                    <span className="text-base font-bold text-white">{formatUSD(portfolioStats.totalCost)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-white/70 font-bold">수익</span>
                    <span className={`text-base font-bold ${plColor}`}>
                      {portfolioStats.returnVal >= 0 ? '+' : ''}{formatUSD(portfolioStats.returnVal)}
                      <span className="ml-1 text-sm font-bold">({portfolioStats.returnPct >= 0 ? '+' : ''}{portfolioStats.returnPct.toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>
                {/* KRW Row */}
                <div className="flex items-center gap-3 flex-nowrap whitespace-nowrap">
                  <span className="text-xs text-white font-bold w-8 flex-shrink-0">KRW</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-white/70 font-bold">평가</span>
                    <span className="text-base font-display font-bold text-celestial-gold">{formatKRW(portfolioStats.totalValueKrw)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-white/70 font-bold">원금</span>
                    <span className="text-base font-bold text-white">{formatKRW(portfolioStats.totalCostKrw)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs text-white/70 font-bold">수익</span>
                    <span className={`text-base font-bold ${plColorKrw}`}>
                      {portfolioStats.returnKrw >= 0 ? '+' : ''}{formatKRW(portfolioStats.returnKrw)}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT: Market Data */}
              <div className={`inner-glass rounded-lg px-4 py-2 flex flex-col justify-center gap-1 border ${stateColors[marketInfo.color]}`}>
                {/* Row 1: NDX, US10Y, VIX */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-blue-300 font-bold">NDX</span>
                    <span className="text-lg font-display font-bold text-blue-400">
                      {state.market.nasdaq ? (state.market.nasdaq / 1000).toFixed(1) + 'K' : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-yellow-300 font-bold">US10Y</span>
                    <span className="text-lg font-display font-bold text-celestial-gold">{state.market.tnx ? state.market.tnx.toFixed(2) + '%' : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-red-400">VIX</span>
                    <span className={`text-lg font-display font-bold ${vixStats.vixColor}`}>{vixStats.vix.toFixed(1)}</span>
                  </div>
                </div>
                {/* Row 2: S&P, 환율, Market State */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-emerald-300 font-bold">S&P</span>
                    <span className="text-lg font-display font-bold text-emerald-400">
                      {state.market.sp500 ? state.market.sp500.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-white font-bold">환율</span>
                    <span className="text-lg font-display font-bold text-white">₩{state.exchangeRate.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold tracking-wider">{marketInfo.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: CONTROLS - 3x2 Grid */}
            <div className="flex-shrink-0 pl-3 border-l border-white/20 flex items-center justify-center w-[280px]">
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {/* Row 1: 시간상태, 커넥트, 로그인 */}
                <div className="flex items-center justify-center gap-1 inner-glass rounded-lg px-1 py-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connectionStatus === 'online' ? 'bg-v64-success' : connectionStatus === 'loading' ? 'bg-yellow-400 animate-pulse' : 'bg-white/40'}`} />
                  <span className="text-xs text-white font-bold">{syncTime}</span>
                </div>
                <button onClick={toggleLive} className={`inner-glass rounded-lg px-1 py-2 flex items-center justify-center gap-1 text-xs font-bold transition-all ${isLive ? 'text-v64-success border border-v64-success/40' : 'text-white/80 hover:text-white'}`}>
                  <i className={`fas fa-${isLive ? 'link' : 'unlink'}`} /><span>{isLive ? 'Live' : 'Connect'}</span>
                </button>
                {user ? (
                  <button onClick={handleLogout} className="inner-glass rounded-lg px-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-all"><i className="fas fa-sign-out-alt" /><span>Logout</span></button>
                ) : (
                  <button onClick={onOpenAuth} className="inner-glass rounded-lg px-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-all"><i className="fas fa-user" /><span>Login</span></button>
                )}
                {/* Row 2: Export, AI, 설정 */}
                <button onClick={onOpenExport} className="inner-glass rounded-lg px-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-all"><i className="fas fa-download" /><span>Export</span></button>
                <button onClick={onOpenFreedom} className="inner-glass rounded-lg px-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-celestial-gold border border-celestial-gold/40 transition-all"><i className="fas fa-robot" /><span>AI</span></button>
                <button onClick={onOpenSettings} className="inner-glass rounded-lg px-1 py-2 flex items-center justify-center gap-1 text-xs font-bold text-white/80 hover:text-white transition-all"><i className="fas fa-cog" /><span>설정</span></button>
              </div>
            </div>
          </div>
        </header>

        {/* Strategy Bar */}
        <div className="glass-card px-4 py-2">
          <div className="flex items-center gap-3">
            <i className="fas fa-compass text-celestial-purple text-sm" />
            <span className="text-[10px] tracking-[0.2em] font-display text-celestial-purple">
              STRATEGY & PLAN
            </span>
            <textarea
              value={localStrategy}
              onChange={handleStrategyChange}
              className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-[11px] text-white/80 font-light resize-none focus:outline-none focus:border-celestial-purple/40 placeholder-white/30 h-[36px]"
              placeholder="현재 투자 전략, 계획, 메모를 입력하세요..."
            />
            <span className={`text-[8px] text-v64-success transition-opacity ${saved ? 'opacity-100' : 'opacity-0'}`}>
              저장됨
            </span>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT 20%: Alerts ═══ */}
      <div className="flex-[2]">
        {alerts.length > 0 ? (
          <div className="h-full flex flex-col justify-between gap-1.5 overflow-y-auto custom-scrollbar">
            {alerts.map((alert, index) => (
              <div
                key={`${alert.type}-${index}`}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border backdrop-blur-md transition-all flex-1 ${
                  alert.severity === 'danger'
                    ? 'bg-v64-danger/10 border-v64-danger/40 text-v64-danger'
                    : 'bg-v64-warning/10 border-v64-warning/40 text-v64-warning'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  alert.severity === 'danger' ? 'bg-v64-danger/20' : 'bg-v64-warning/20'
                }`}>
                  <i className={`fas ${
                    alert.type === 'concentration' ? 'fa-exclamation-triangle' :
                    alert.type === 'sector' ? 'fa-chart-pie' :
                    'fa-chart-line'
                  } text-[10px]`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[11px] tracking-wide">{alert.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                      alert.severity === 'danger' ? 'bg-v64-danger/20' : 'bg-v64-warning/20'
                    }`}>
                      {alert.value.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[9px] opacity-80 truncate">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center glass-card">
            <div className="text-center text-white/40">
              <i className="fas fa-shield-alt text-2xl mb-2" />
              <p className="text-[10px] tracking-wide">포트폴리오 상태 양호</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
