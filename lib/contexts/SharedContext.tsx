'use client';

// ═══════════════════════════════════════════════════════════════
// Shared Context - 모든 Context가 공유하는 핵심 상태
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { NexusState, TradeLog, TradeSums } from '../types';
import { loadState, saveState, loadStateFromSupabase, saveStateToSupabase, saveSnapshot } from '../storage';
import { DEFAULT_EXCHANGE_RATE, UI_CONFIG } from '../config';

// 기본 상태
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

// Shared Context 타입
interface SharedContextType {
  state: NexusState;
  setState: React.Dispatch<React.SetStateAction<NexusState>>;
  isLoaded: boolean;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  saveToHistory: (currentState: NexusState) => void;
  calculateTradeReturns: (tradeLogs: TradeLog[]) => TradeSums;
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

const SharedContext = createContext<SharedContextType | null>(null);

export function SharedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NexusState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Undo/Redo state
  const [history, setHistory] = useState<{ past: NexusState[]; future: NexusState[] }>({
    past: [],
    future: [],
  });
  const isUndoRedoAction = useRef(false);

  // Debounce timer ref
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // FIFO 회계 로직: 매매일지에서 실현 손익 자동 계산
  const calculateTradeReturns = useCallback((tradeLogs: TradeLog[]): TradeSums => {
    const positions: Record<string, Array<{ qty: number; price: number; fee: number }>> = {};
    const realizedPnL: Record<string, number> = {};

    const sortedLogs = [...tradeLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedLogs.forEach(log => {
      const { ticker, type, qty, price, fee } = log;

      if (!positions[ticker]) {
        positions[ticker] = [];
        realizedPnL[ticker] = 0;
      }

      if (type === 'BUY') {
        positions[ticker].push({ qty, price, fee });
      } else if (type === 'SELL') {
        let remainingQty = qty;
        let sellValue = qty * price - fee;

        if (positions[ticker].length === 0) {
          if (realizedPnL[ticker] === undefined || realizedPnL[ticker] === 0) {
            realizedPnL[ticker] = sellValue;
          } else {
            realizedPnL[ticker] += sellValue;
          }
          return;
        }

        while (remainingQty > 0 && positions[ticker].length > 0) {
          const oldestPosition = positions[ticker][0];

          if (oldestPosition.qty <= remainingQty) {
            const costBasis = oldestPosition.qty * oldestPosition.price + oldestPosition.fee;
            const saleProceeds = (oldestPosition.qty / qty) * sellValue;
            const pnl = saleProceeds - costBasis;
            realizedPnL[ticker] += pnl;

            remainingQty -= oldestPosition.qty;
            positions[ticker].shift();
          } else {
            const costBasis = remainingQty * oldestPosition.price + (remainingQty / oldestPosition.qty) * oldestPosition.fee;
            const saleProceeds = (remainingQty / qty) * sellValue;
            const pnl = saleProceeds - costBasis;
            realizedPnL[ticker] += pnl;

            oldestPosition.qty -= remainingQty;
            oldestPosition.fee *= (oldestPosition.qty / (oldestPosition.qty + remainingQty));
            remainingQty = 0;
          }
        }
      }
    });

    return realizedPnL;
  }, []);

  // Load from localStorage and Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const localState = loadState();
        setState(prev => {
          const newState = { ...prev, ...localState };
          if (localState.tradeLogs && localState.tradeLogs.length > 0) {
            const calculatedTradeSums = calculateTradeReturns(localState.tradeLogs);
            const mergedTradeSums = {
              ...calculatedTradeSums,
              ...(localState.tradeSums || {}),
            };
            return { ...newState, tradeSums: mergedTradeSums };
          }
          return newState;
        });

        const supabaseState = await loadStateFromSupabase();
        setState(prev => {
          const newState = { ...prev, ...supabaseState };
          if (supabaseState.tradeLogs && supabaseState.tradeLogs.length > 0) {
            const calculatedTradeSums = calculateTradeReturns(supabaseState.tradeLogs);
            const mergedTradeSums = {
              ...calculatedTradeSums,
              ...(supabaseState.tradeSums || {}),
              ...(prev.tradeSums || {}),
            };
            return { ...newState, tradeSums: mergedTradeSums };
          }
          return newState;
        });
      } catch (error) {
        console.error('Failed to load state:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadData();
  }, [calculateTradeReturns]);

  // 30분 간격 스냅샷 저장
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!isLoaded) return;

    const initialTimeout = setTimeout(() => {
      saveSnapshot(stateRef.current as any);
    }, 60 * 1000);

    snapshotIntervalRef.current = setInterval(() => {
      saveSnapshot(stateRef.current as any);
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [isLoaded]);

  // Save to localStorage and Supabase on state change (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    try {
      saveState(state);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }

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
    }, UI_CONFIG.DEBOUNCE_DELAY);

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
      past: [...prev.past, currentState].slice(-UI_CONFIG.MAX_HISTORY),
      future: [],
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
        future: [state, ...prev.future].slice(0, UI_CONFIG.MAX_HISTORY),
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
        past: [...prev.past, state].slice(-UI_CONFIG.MAX_HISTORY),
        future: newFuture,
      };
    });
  }, [state]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const undoCount = history.past.length;
  const redoCount = history.future.length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner spinner text-2xl opacity-50" />
      </div>
    );
  }

  return (
    <SharedContext.Provider
      value={{
        state,
        setState,
        isLoaded,
        isSyncing,
        setIsSyncing,
        saveToHistory,
        calculateTradeReturns,
        undo,
        redo,
        canUndo,
        canRedo,
        undoCount,
        redoCount,
      }}
    >
      {children}
    </SharedContext.Provider>
  );
}

export function useShared() {
  const context = useContext(SharedContext);
  if (!context) {
    throw new Error('useShared must be used within SharedProvider');
  }
  return context;
}
