'use client';

// ═══════════════════════════════════════════════════════════════
// Portfolio Context - 자산 관리
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, useRef, useEffect, ReactNode } from 'react';
import { Asset } from '../types';
import { API_ENDPOINTS } from '../config';
import { fetchWithExponentialBackoff } from '../utils';
import { useShared } from './SharedContext';
import { PortfolioContextType } from './types';

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { state, setState, saveToHistory } = useShared();

  // useRef로 현재 assets 참조 (무한 루프 방지)
  const assetsRef = useRef(state.assets);
  useEffect(() => {
    assetsRef.current = state.assets;
  }, [state.assets]);

  const updateAssets = useCallback((assets: Asset[]) => {
    setState(prev => {
      saveToHistory(prev);
      return { ...prev, assets };
    });
  }, [setState, saveToHistory]);

  const addAsset = useCallback((asset: Asset) => {
    setState(prev => {
      saveToHistory(prev);
      return { ...prev, assets: [...prev.assets, asset] };
    });
  }, [setState, saveToHistory]);

  const removeAsset = useCallback((index: number) => {
    setState(prev => {
      saveToHistory(prev);
      return {
        ...prev,
        assets: prev.assets.filter((_, i) => i !== index),
      };
    });
  }, [setState, saveToHistory]);

  const updateAsset = useCallback((index: number, updates: Partial<Asset>) => {
    setState(prev => {
      saveToHistory(prev);
      return {
        ...prev,
        assets: prev.assets.map((a, i) => (i === index ? { ...a, ...updates } : a)),
      };
    });
  }, [setState, saveToHistory]);

  const refreshPrices = useCallback(async () => {
    if (state.isFetching) return;

    setState(prev => ({ ...prev, isFetching: true }));

    try {
      // Fetch market data with retry
      try {
        const marketRes = await fetchWithExponentialBackoff(API_ENDPOINTS.MARKET);
        if (marketRes.ok) {
          const marketData = await marketRes.json();
          setState(prev => ({
            ...prev,
            previousMarket: { ...prev.market },
            market: { ...prev.market, ...marketData },
            exchangeRate: marketData.krw || prev.exchangeRate,
          }));
        }
      } catch {
        console.warn('Market data fetch failed after retries');
      }

      // Fetch asset prices with retry
      const currentAssets = assetsRef.current;
      const previousPrices: Record<string, number> = {};
      currentAssets.forEach(a => {
        if (a.price > 0) previousPrices[a.ticker] = a.price;
      });

      const updatedAssets = await Promise.all(
        currentAssets.map(async (asset) => {
          try {
            const res = await fetchWithExponentialBackoff(API_ENDPOINTS.PRICE(asset.ticker));
            if (res.ok) {
              const data = await res.json();
              return { ...asset, price: data.price };
            }
          } catch {
            console.warn(`Price fetch failed for ${asset.ticker} after retries`);
          }
          return asset;
        })
      );

      setState(prev => ({
        ...prev,
        assets: updatedAssets,
        previousPrices,
        lastSync: Date.now(),
        isFetching: false,
      }));
    } catch {
      setState(prev => ({ ...prev, isFetching: false }));
    }
  }, [state.isFetching, setState]);

  return (
    <PortfolioContext.Provider
      value={{
        assets: state.assets,
        previousPrices: state.previousPrices,
        updateAssets,
        addAsset,
        removeAsset,
        updateAsset,
        refreshPrices,
        isFetching: state.isFetching,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolioContext must be used within PortfolioProvider');
  }
  return context;
}
