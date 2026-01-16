'use client';

// ═══════════════════════════════════════════════════════════════
// Market Context - 시장 데이터 관리
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { MarketData } from '../types';
import { useShared } from './SharedContext';
import { MarketContextType } from './types';

const MarketContext = createContext<MarketContextType | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const { state, setState } = useShared();

  const updateMarket = useCallback((market: Partial<MarketData>) => {
    setState(prev => ({
      ...prev,
      previousMarket: { ...prev.market },
      market: { ...prev.market, ...market },
      exchangeRate: market.krw || prev.exchangeRate,
    }));
  }, [setState]);

  const setExchangeRate = useCallback((rate: number) => {
    setState(prev => ({ ...prev, exchangeRate: rate }));
  }, [setState]);

  return (
    <MarketContext.Provider
      value={{
        market: state.market,
        previousMarket: state.previousMarket,
        exchangeRate: state.exchangeRate,
        updateMarket,
        setExchangeRate,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarketContext() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarketContext must be used within MarketProvider');
  }
  return context;
}
