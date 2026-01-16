'use client';

// ═══════════════════════════════════════════════════════════════
// Header - 메인 헤더 컴포넌트 (리팩토링)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { supabase } from '@/lib/supabase';
import { PortfolioSummary, MarketIndicators, HeaderControls } from './headerParts';

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
            <div className="text-[8px] md:text-[10px] tracking-[0.3em] opacity-90 mt-0.5 md:mt-1">NEXUS INTELLIGENCE V1.7</div>
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
          onExport={onOpenExport}
          onOpenAuth={onOpenAuth}
          onOpenFreedom={onOpenFreedom}
          onOpenSettings={onOpenSettings}
          toast={toast}
        />
      </div>
    </header>
  );
}
