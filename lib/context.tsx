'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { NexusState, Asset, Dividend, MarketData, ThemeType, TradeLog, TradeSums } from './types';
import { loadState, saveState, loadStateFromSupabase, saveStateToSupabase, saveSnapshot } from './storage';
import { DEFAULT_EXCHANGE_RATE, API_ENDPOINTS, REFRESH_INTERVALS } from './config';
import { isValidGoogleScriptUrl, fetchWithExponentialBackoff } from './utils';

interface NexusContextType {
  state: NexusState;
  updateAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (index: number) => void;
  updateAsset: (index: number, asset: Partial<Asset>) => void;
  addDividend: (dividend: Dividend) => void;
  removeDividend: (index: number) => void;
  addTradeLog: (trade: TradeLog) => void;
  updateTradeLog: (id: string, trade: TradeLog) => void;
  removeTradeLog: (id: string) => void;
  updateMarket: (market: Partial<MarketData>) => void;
  setExchangeRate: (rate: number) => void;
  setTradeSums: (ticker: string, amount: number) => void;
  setStrategy: (strategy: string) => void;
  syncFromSheet: () => Promise<void>;
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
  // Trade Modal states
  tradeModalOpen: boolean;
  setTradeModalOpen: (open: boolean) => void;
  editingTrade: TradeLog | null;
  openAddTradeModal: () => void;
  openEditTradeModal: (trade: TradeLog) => void;
  closeTradeModal: () => void;
  saveTradeFromModal: (trade: TradeLog) => void;
  // Sync status
  isSyncing: boolean;
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

const defaultState: NexusState = {
  assets: [],
  dividends: [],
  tradeLogs: [],
  timeline: [],
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  tradeSums: {},
  scriptUrl: '',
  strategy: '',
  theme: 'dark',
  market: { nasdaq: 0, sp500: 0, vix: 0, tnx: 0, krw: 0 },
  previousMarket: { nasdaq: 0, sp500: 0, vix: 0, tnx: 0, krw: 0 },
  previousPrices: {},
  lastSync: null,
  compactMode: false,
  vixAlertDismissed: false,
  isFetching: false,
};

const NexusContext = createContext<NexusContextType | null>(null);

export function NexusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NexusState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modal states
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Dividend Modal states
  const [dividendModalOpen, setDividendModalOpen] = useState(false);

  // Trade Modal states
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeLog | null>(null);

  // Undo/Redo state
  const MAX_HISTORY = 10;
  const [history, setHistory] = useState<{ past: NexusState[]; future: NexusState[] }>({
    past: [],
    future: [],
  });
  const isUndoRedoAction = useRef(false);

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // 먼저 localStorage에서 빠르게 로드 (즉시 표시)
        const localState = loadState();
        setState(prev => ({ ...prev, ...localState }));
        
        // 그 다음 Supabase에서 로드 (최신 데이터)
        const supabaseState = await loadStateFromSupabase();
        setState(prev => ({ ...prev, ...supabaseState }));
      } catch (error) {
        console.error('Failed to load state:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  // 30분 간격 스냅샷 저장
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!isLoaded) return;

    // 초기 스냅샷 저장 (로드 후 1분 뒤)
    const initialTimeout = setTimeout(() => {
      saveSnapshot(stateRef.current as any);
    }, 60 * 1000);

    // 30분 간격 스냅샷
    snapshotIntervalRef.current = setInterval(() => {
      saveSnapshot(stateRef.current as any);
    }, 30 * 60 * 1000); // 30분

    return () => {
      clearTimeout(initialTimeout);
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [isLoaded]); // state 변경마다 재실행 방지

  // Save to Supabase on state change (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    // localStorage에 즉시 저장 (로컬 백업) - 동기적이므로 빠름
    try {
      saveState(state);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

    // Supabase 저장은 debounce (1초 후)
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await saveStateToSupabase(state);
      } catch (error) {
        console.error('Failed to save to Supabase:', error);
      } finally {
        setIsSyncing(false);
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [state, isLoaded]);

  // 히스토리에 현재 상태 저장 (Undo용)
  const saveToHistory = useCallback((currentState: NexusState) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory(prev => ({
      past: [...prev.past, currentState].slice(-MAX_HISTORY),
      future: [], // 새 액션 시 future 초기화
    }));
  }, []);

  // Undo 함수
  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;

      const newPast = prev.past.slice(0, -1);
      const previousState = prev.past[prev.past.length - 1];

      isUndoRedoAction.current = true;
      setState(previousState);

      return {
        past: newPast,
        future: [state, ...prev.future].slice(0, MAX_HISTORY),
      };
    });
  }, [state]);

  // Redo 함수
  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;

      const nextState = prev.future[0];
      const newFuture = prev.future.slice(1);

      isUndoRedoAction.current = true;
      setState(nextState);

      return {
        past: [...prev.past, state].slice(-MAX_HISTORY),
        future: newFuture,
      };
    });
  }, [state]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const undoCount = history.past.length;
  const redoCount = history.future.length;

  const updateAssets = useCallback((assets: Asset[]) => {
    setState(prev => {
      saveToHistory(prev);
      return { ...prev, assets };
    });
  }, [saveToHistory]);

  const addAsset = useCallback((asset: Asset) => {
    setState(prev => {
      saveToHistory(prev);
      return { ...prev, assets: [...prev.assets, asset] };
    });
  }, [saveToHistory]);

  const removeAsset = useCallback((index: number) => {
    setState(prev => {
      saveToHistory(prev);
      return {
        ...prev,
        assets: prev.assets.filter((_, i) => i !== index),
      };
    });
  }, [saveToHistory]);

  const updateAsset = useCallback((index: number, updates: Partial<Asset>) => {
    setState(prev => {
      saveToHistory(prev);
      return {
        ...prev,
        assets: prev.assets.map((a, i) => (i === index ? { ...a, ...updates } : a)),
      };
    });
  }, [saveToHistory]);

  const addDividend = useCallback((dividend: Dividend) => {
    setState(prev => {
      saveToHistory(prev);
      return { ...prev, dividends: [...prev.dividends, dividend] };
    });
  }, [saveToHistory]);

  const removeDividend = useCallback((index: number) => {
    setState(prev => {
      saveToHistory(prev);
      return {
        ...prev,
        dividends: prev.dividends.filter((_, i) => i !== index),
      };
    });
  }, [saveToHistory]);

  // FIFO 회계 로직: 매매일지에서 실현 손익 자동 계산
  const calculateTradeReturns = useCallback((tradeLogs: TradeLog[]): TradeSums => {
    // ticker별로 포지션 추적
    const positions: Record<string, Array<{ qty: number; price: number; fee: number }>> = {};
    const realizedPnL: Record<string, number> = {};

    // 날짜순 정렬
    const sortedLogs = [...tradeLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedLogs.forEach(log => {
      const { ticker, type, qty, price, fee } = log;

      if (!positions[ticker]) {
        positions[ticker] = [];
        realizedPnL[ticker] = 0;
      }

      if (type === 'BUY') {
        // 매수: 포지션에 추가
        positions[ticker].push({ qty, price, fee });
      } else if (type === 'SELL') {
        // 매도: FIFO 방식으로 가장 오래된 포지션부터 매도
        let remainingQty = qty;
        let sellValue = qty * price - fee; // 매도 금액 (수수료 차감)

        while (remainingQty > 0 && positions[ticker].length > 0) {
          const oldestPosition = positions[ticker][0];

          if (oldestPosition.qty <= remainingQty) {
            // 전체 포지션 매도
            const costBasis = oldestPosition.qty * oldestPosition.price + oldestPosition.fee;
            const saleProceeds = (oldestPosition.qty / qty) * sellValue;
            realizedPnL[ticker] += saleProceeds - costBasis;

            remainingQty -= oldestPosition.qty;
            positions[ticker].shift();
          } else {
            // 일부 포지션 매도
            const costBasis = remainingQty * oldestPosition.price + (remainingQty / oldestPosition.qty) * oldestPosition.fee;
            const saleProceeds = (remainingQty / qty) * sellValue;
            realizedPnL[ticker] += saleProceeds - costBasis;

            oldestPosition.qty -= remainingQty;
            oldestPosition.fee *= (oldestPosition.qty / (oldestPosition.qty + remainingQty)); // 비례 배분
            remainingQty = 0;
          }
        }
      }
    });

    return realizedPnL;
  }, []);

  const addTradeLog = useCallback((trade: TradeLog) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeLogs = [...prev.tradeLogs, trade];
      const newTradeSums = calculateTradeReturns(newTradeLogs);
      return { ...prev, tradeLogs: newTradeLogs, tradeSums: newTradeSums };
    });
  }, [saveToHistory, calculateTradeReturns]);

  const updateTradeLog = useCallback((id: string, trade: TradeLog) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeLogs = prev.tradeLogs.map(t => t.id === id ? trade : t);
      const newTradeSums = calculateTradeReturns(newTradeLogs);
      return { ...prev, tradeLogs: newTradeLogs, tradeSums: newTradeSums };
    });
  }, [saveToHistory, calculateTradeReturns]);

  const removeTradeLog = useCallback((id: string) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeLogs = prev.tradeLogs.filter(t => t.id !== id);
      const newTradeSums = calculateTradeReturns(newTradeLogs);
      return { ...prev, tradeLogs: newTradeLogs, tradeSums: newTradeSums };
    });
  }, [saveToHistory, calculateTradeReturns]);

  const updateMarket = useCallback((market: Partial<MarketData>) => {
    setState(prev => ({
      ...prev,
      previousMarket: { ...prev.market },
      market: { ...prev.market, ...market },
      exchangeRate: market.krw || prev.exchangeRate,
    }));
  }, []);

  const setExchangeRate = useCallback((rate: number) => {
    setState(prev => ({ ...prev, exchangeRate: rate }));
  }, []);

  const setTradeSums = useCallback((ticker: string, amount: number) => {
    setState(prev => ({
      ...prev,
      tradeSums: { ...prev.tradeSums, [ticker]: amount },
    }));
  }, []);

  const setStrategy = useCallback((strategy: string) => {
    setState(prev => ({ ...prev, strategy }));
  }, []);

  // useRef로 현재 assets 참조 (무한 루프 방지)
  const assetsRef = useRef(state.assets);
  useEffect(() => {
    assetsRef.current = state.assets;
  }, [state.assets]);

  const refreshPrices = useCallback(async () => {
    if (state.isFetching) return;

    setState(prev => ({ ...prev, isFetching: true }));

    try {
      // Fetch market data with retry
      try {
        const marketRes = await fetchWithExponentialBackoff(API_ENDPOINTS.MARKET);
        if (marketRes.ok) {
          const marketData = await marketRes.json();
          updateMarket(marketData);
        }
      } catch {
        console.warn('Market data fetch failed after retries');
      }

      // Fetch asset prices with retry - useRef 사용
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
            // Keep original price on error after retries
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
  }, [state.isFetching, updateMarket]);

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

    const icons: Record<string, string> = { success: 'check', danger: 'times', warning: 'exclamation', info: 'info' };
    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${type}`;
    toastEl.style.borderColor = `var(--${type === 'danger' ? 'danger' : type})`;

    // XSS 방지: DOM API를 사용하여 안전하게 요소 생성
    const iconWrapper = document.createElement('div');
    iconWrapper.style.cssText = 'width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1)';
    const icon = document.createElement('i');
    icon.className = `fas fa-${icons[type]}`;
    icon.style.fontSize = '10px';
    iconWrapper.appendChild(icon);

    const messageSpan = document.createElement('span');
    messageSpan.style.color = 'rgba(255,255,255,0.9)';
    messageSpan.textContent = message; // textContent로 XSS 방지

    toastEl.appendChild(iconWrapper);
    toastEl.appendChild(messageSpan);
    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toastEl.remove(), 300);
    }, 3000);
  }, []);

  const syncFromSheet = useCallback(async () => {
    const scriptUrl = localStorage.getItem('nexus_script_url');

    if (!scriptUrl || scriptUrl.trim() === '') {
      toast('설정에서 Google Script URL을 입력하세요', 'warning');
      return;
    }

    // URL 유효성 검사
    if (!isValidGoogleScriptUrl(scriptUrl)) {
      toast('잘못된 Google Script URL 형식', 'danger');
      return;
    }

    try {
      toast('구글 시트 동기화 중...', 'info');
      
      const res = await fetch(scriptUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          
          // 배열 직접 반환 또는 { dividends: [...] } 객체 모두 처리
          let dividends: Array<{ date: string; ticker: string; dps: number; qty: number }> = [];
          let tradeSumsData = null;
          
          if (Array.isArray(data)) {
            // 배열 직접 반환인 경우
            dividends = data;
          } else if (data.dividends && Array.isArray(data.dividends)) {
            // { dividends: [...] } 객체인 경우
            dividends = data.dividends;
            tradeSumsData = data.tradeSums;
          }
          
          if (dividends.length > 0) {
            setState(prev => ({
              ...prev,
              dividends: dividends,
              tradeSums: tradeSumsData || prev.tradeSums,
            }));
            toast(`동기화 완료: ${dividends.length}개 배당 기록`, 'success');
          } else {
            toast('배당 기록이 없습니다', 'warning');
          }
        } catch {
          toast('JSON 파싱 오류', 'danger');
          console.error('Response text:', text);
        }
      } else {
        toast(`동기화 실패: HTTP ${res.status}`, 'danger');
      }
    } catch (err) {
      console.error('Sync error:', err);
      toast('네트워크 오류 또는 CORS 문제', 'danger');
    }
  }, [toast]);

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
      setState(prev => {
        saveToHistory(prev);
        return {
          ...prev,
          assets: prev.assets.map((a, i) => (i === editingIndex ? { ...a, ...asset } : a)),
        };
      });
      toast('Asset updated', 'success');
    } else {
      // 추가 모드
      setState(prev => {
        saveToHistory(prev);
        return { ...prev, assets: [...prev.assets, asset] };
      });
      toast('Asset added', 'success');
    }
    closeAssetModal();
  }, [editingIndex, closeAssetModal, toast, saveToHistory]);

  // Dividend Modal functions
  const openDividendModal = useCallback(() => {
    setDividendModalOpen(true);
  }, []);

  const closeDividendModal = useCallback(() => {
    setDividendModalOpen(false);
  }, []);

  // Trade Modal functions
  const openAddTradeModal = useCallback(() => {
    setEditingTrade(null);
    setTradeModalOpen(true);
  }, []);

  const openEditTradeModal = useCallback((trade: TradeLog) => {
    setEditingTrade(trade);
    setTradeModalOpen(true);
  }, []);

  const closeTradeModal = useCallback(() => {
    setTradeModalOpen(false);
    setEditingTrade(null);
  }, []);

  const saveTradeFromModal = useCallback((trade: TradeLog) => {
    if (editingTrade !== null) {
      // 수정 모드
      updateTradeLog(editingTrade.id, trade);
      toast('Trade updated', 'success');
    } else {
      // 추가 모드
      addTradeLog(trade);
      toast('Trade added', 'success');
    }
    closeTradeModal();
  }, [editingTrade, addTradeLog, updateTradeLog, closeTradeModal, toast]);

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
        addTradeLog,
        updateTradeLog,
        removeTradeLog,
        updateMarket,
        setExchangeRate,
        setTradeSums,
        setStrategy,
        syncFromSheet,
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
        // Trade Modal states
        tradeModalOpen,
        setTradeModalOpen,
        editingTrade,
        openAddTradeModal,
        openEditTradeModal,
        closeTradeModal,
        saveTradeFromModal,
        // Sync status
        isSyncing,
        // Undo/Redo
        undo,
        redo,
        canUndo,
        canRedo,
        undoCount,
        redoCount,
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
