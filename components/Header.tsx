'use client';

// ═══════════════════════════════════════════════════════════════
// Header - 메인 헤더 컴포넌트 (리팩토링)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/lib/types';
import { PortfolioSummary, MarketIndicators, HeaderControls } from './headerParts';

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
      }
    };
  }, []);

  // Calculate portfolio stats
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

    return {
      totalCost,
      totalValue,
      totalCostKrw,
      totalValueKrw,
      returnVal: totalValue - totalCost,
      returnKrw: totalValueKrw - totalCostKrw,
    };
  }, [state.assets, state.exchangeRate]);

  // Export function
  const handleExportFreedom = useCallback(() => {
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

    const sectorStats = groupBy(state.assets, 'sector');
    const typeStats = groupBy(state.assets, 'type');

    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const recentDividends = state.dividends.filter(d => new Date(d.date) >= oneYearAgo);
    const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + (d.qty * d.dps), 0);

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

    const totalRealizedPL = Object.values(state.tradeSums).reduce((acc, val) => acc + val, 0);

    const recentTrend = state.timeline.slice(-30).map(t => ({
      date: t.date,
      value: Math.round(t.value),
      returnPct: t.cost > 0 ? ((t.value - t.cost) / t.cost * 100).toFixed(2) : 0
    }));

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
  }, [state, portfolioStats, toast]);

  return (
    <header className="glass-card p-3 md:p-4 lg:p-5">
      <div className="flex flex-wrap justify-between items-center gap-3 md:gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 border border-white/20 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <i className="fas fa-infinity text-lg md:text-xl text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl lg:text-2xl font-bold tracking-[0.2em] font-display text-white text-glow">CELESTIAL</h1>
            <div className="text-[8px] md:text-[10px] tracking-[0.3em] opacity-90 mt-0.5 md:mt-1">NEXUS INTELLIGENCE V1.0</div>
          </div>
        </div>

        {/* Portfolio Summary */}
        <PortfolioSummary {...portfolioStats} />

        {/* Market Indicators */}
        <MarketIndicators market={state.market} exchangeRate={state.exchangeRate} />

        {/* Controls */}
        <HeaderControls
          user={user}
          connectionStatus={connectionStatus}
          syncTime={syncTime}
          clock={clock}
          isLive={isLive}
          onToggleLive={toggleLive}
          onExport={handleExportFreedom}
          onOpenAuth={onOpenAuth}
          onOpenFreedom={onOpenFreedom}
          onOpenSettings={onOpenSettings}
          toast={toast}
        />
      </div>
    </header>
  );
}
