'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { NexusState, Asset, Dividend, MarketData } from './types';
import { loadState, saveState } from './storage';
import { DEFAULT_EXCHANGE_RATE } from './config';

interface NexusContextType {
  state: NexusState;
  updateAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (index: number) => void;
  updateAsset: (index: number, asset: Partial<Asset>) => void;
  addDividend: (dividend: Dividend) => void;
  removeDividend: (index: number) => void;
  updateMarket: (market: Partial<MarketData>) => void;
  refreshPrices: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => void;
  setCompactMode: (compact: boolean) => void;
  toast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  // Asset Modal states
  assetModalOpen: boolean;
  setAssetModalOpen: (open: boolean) => void;
  editingAsset: Asset | null;
  editingIndex: number | null;
  openAddAssetModal: () => void;
  openEditAssetModal: (index: number) => void;
  closeAssetModal: () => void;
  saveAssetFromModal: (asset: Asset) => void;
  // Dividend Modal states
  dividendModalOpen: boolean;
  setDividendModalOpen: (open: boolean) => void;
  openDividendModal: () => void;
  closeDividendModal: () => void;
}

const defaultState: NexusState = {
  assets: [],
  dividends: [],
  timeline: [],
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  tradeSums: { PLTY: 0, HOOY: 0 },
  scriptUrl: '',
  strategy: '',
  theme: 'dark',
  market: { nasdaq: 0, sp500: 0, vix: 0, tnx: 0, krw: 0 },
  previousMarket: { nasdaq: 0, sp500: 0, vix: 0, tnx: 0, krw: 0 },
  previousPrices: {},
  lastSync: null,
  compactMode: false,
  vixAlertDismissed: false,
  isLive: false,
  isFetching: false,
};

const NexusContext = createContext<NexusContextType | null>(null);

export function NexusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NexusState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Modal states
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Dividend Modal states
  const [dividendModalOpen, setDividendModalOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadState();
    setState(prev => ({ ...prev, ...saved }));
    setIsLoaded(true);
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  const updateAssets = useCallback((assets: Asset[]) => {
    setState(prev => ({ ...prev, assets }));
  }, []);

  const addAsset = useCallback((asset: Asset) => {
    setState(prev => ({ ...prev, assets: [...prev.assets, asset] }));
  }, []);

  const removeAsset = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.filter((_, i) => i !== index),
    }));
  }, []);

  const updateAsset = useCallback((index: number, updates: Partial<Asset>) => {
    setState(prev => ({
      ...prev,
      assets: prev.assets.map((a, i) => (i === index ? { ...a, ...updates } : a)),
    }));
  }, []);

  const addDividend = useCallback((dividend: Dividend) => {
    setState(prev => ({ ...prev, dividends: [...prev.dividends, dividend] }));
  }, []);

  const removeDividend = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      dividends: prev.dividends.filter((_, i) => i !== index),
    }));
  }, []);

  const updateMarket = useCallback((market: Partial<MarketData>) => {
    setState(prev => ({
      ...prev,
      previousMarket: { ...prev.market },
      market: { ...prev.market, ...market },
      exchangeRate: market.krw || prev.exchangeRate,
    }));
  }, []);

  const refreshPrices = useCallback(async () => {
    if (state.isFetching) return;
    
    setState(prev => ({ ...prev, isFetching: true }));
    
    try {
      // Fetch market data
      const marketRes = await fetch('/api/market');
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        updateMarket(marketData);
      }

      // Fetch asset prices
      const previousPrices: Record<string, number> = {};
      state.assets.forEach(a => {
        if (a.price > 0) previousPrices[a.ticker] = a.price;
      });

      const updatedAssets = await Promise.all(
        state.assets.map(async (asset) => {
          try {
            const res = await fetch(`/api/price/${asset.ticker}`);
            if (res.ok) {
              const data = await res.json();
              return { ...asset, price: data.price };
            }
          } catch {}
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

      toast('SYNCHRONIZED', 'success');
    } catch (error) {
      setState(prev => ({ ...prev, isFetching: false }));
      toast('Sync failed', 'danger');
    }
  }, [state.assets, state.isFetching]);

  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setState(prev => ({ ...prev, theme }));
    document.documentElement.className = theme;
  }, []);

  const setCompactMode = useCallback((compactMode: boolean) => {
    setState(prev => ({ ...prev, compactMode }));
  }, []);

  const toast = useCallback((message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: 'check', danger: 'times', warning: 'exclamation', info: 'info' };
    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${type}`;
    toastEl.style.borderColor = `var(--${type === 'danger' ? 'danger' : type})`;
    toastEl.innerHTML = `
      <div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1)">
        <i class="fas fa-${icons[type]}" style="font-size:10px"></i>
      </div>
      <span style="color:rgba(255,255,255,0.9)">${message}</span>
    `;
    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toastEl.remove(), 300);
    }, 3000);
  }, []);

  // Modal functions
  const openAddAssetModal = useCallback(() => {
    setEditingAsset(null);
    setEditingIndex(null);
    setAssetModalOpen(true);
  }, []);

  const openEditAssetModal = useCallback((index: number) => {
    setEditingAsset(state.assets[index]);
    setEditingIndex(index);
    setAssetModalOpen(true);
  }, [state.assets]);

  const closeAssetModal = useCallback(() => {
    setAssetModalOpen(false);
    setEditingAsset(null);
    setEditingIndex(null);
  }, []);

  const saveAssetFromModal = useCallback((asset: Asset) => {
    if (editingIndex !== null) {
      // 수정 모드
      setState(prev => ({
        ...prev,
        assets: prev.assets.map((a, i) => (i === editingIndex ? { ...a, ...asset } : a)),
      }));
      toast('Asset updated', 'success');
    } else {
      // 추가 모드
      setState(prev => ({ ...prev, assets: [...prev.assets, asset] }));
      toast('Asset added', 'success');
    }
    closeAssetModal();
  }, [editingIndex, closeAssetModal, toast]);

  // Dividend Modal functions
  const openDividendModal = useCallback(() => {
    setDividendModalOpen(true);
  }, []);

  const closeDividendModal = useCallback(() => {
    setDividendModalOpen(false);
  }, []);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">
      <i className="fas fa-spinner spinner text-2xl opacity-50" />
    </div>;
  }

  return (
    <NexusContext.Provider
      value={{
        state,
        updateAssets,
        addAsset,
        removeAsset,
        updateAsset,
        addDividend,
        removeDividend,
        updateMarket,
        refreshPrices,
        setTheme,
        setCompactMode,
        toast,
        // Asset Modal states
        assetModalOpen,
        setAssetModalOpen,
        editingAsset,
        editingIndex,
        openAddAssetModal,
        openEditAssetModal,
        closeAssetModal,
        saveAssetFromModal,
        // Dividend Modal states
        dividendModalOpen,
        setDividendModalOpen,
        openDividendModal,
        closeDividendModal,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
}

export function useNexus() {
  const context = useContext(NexusContext);
  if (!context) {
    throw new Error('useNexus must be used within NexusProvider');
  }
  return context;
}
