'use client';

// ═══════════════════════════════════════════════════════════════
// Trade Context - 거래 관리
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { TradeLog } from '../types';
import { useShared } from './SharedContext';
import { TradeContextType } from './types';

const TradeContext = createContext<TradeContextType | null>(null);

export function TradeProvider({ children }: { children: ReactNode }) {
  const { state, setState, saveToHistory, calculateTradeReturns } = useShared();

  const addTradeLog = useCallback((trade: TradeLog) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeLogs = [...prev.tradeLogs, trade];
      const newTradeSums = calculateTradeReturns(newTradeLogs);
      return { ...prev, tradeLogs: newTradeLogs, tradeSums: newTradeSums };
    });
  }, [setState, saveToHistory, calculateTradeReturns]);

  const updateTradeLog = useCallback((id: string, trade: TradeLog) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeLogs = prev.tradeLogs.map(t => t.id === id ? trade : t);
      const newTradeSums = calculateTradeReturns(newTradeLogs);
      return { ...prev, tradeLogs: newTradeLogs, tradeSums: newTradeSums };
    });
  }, [setState, saveToHistory, calculateTradeReturns]);

  const removeTradeLog = useCallback((id: string) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeLogs = prev.tradeLogs.filter(t => t.id !== id);
      const newTradeSums = calculateTradeReturns(newTradeLogs);
      return { ...prev, tradeLogs: newTradeLogs, tradeSums: newTradeSums };
    });
  }, [setState, saveToHistory, calculateTradeReturns]);

  const setTradeSums = useCallback((ticker: string, amount: number) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeSums = { ...prev.tradeSums };
      if (amount === 0 && newTradeSums[ticker] === 0) {
        delete newTradeSums[ticker];
      } else {
        newTradeSums[ticker] = amount;
      }
      return {
        ...prev,
        tradeSums: newTradeSums,
      };
    });
  }, [setState, saveToHistory]);

  const removeTradeSum = useCallback((ticker: string) => {
    setState(prev => {
      saveToHistory(prev);
      const newTradeSums = { ...prev.tradeSums };
      delete newTradeSums[ticker];
      return {
        ...prev,
        tradeSums: newTradeSums,
      };
    });
  }, [setState, saveToHistory]);

  return (
    <TradeContext.Provider
      value={{
        tradeLogs: state.tradeLogs,
        tradeSums: state.tradeSums,
        addTradeLog,
        updateTradeLog,
        removeTradeLog,
        setTradeSums,
        removeTradeSum,
        calculateTradeReturns,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
}

export function useTradeContext() {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTradeContext must be used within TradeProvider');
  }
  return context;
}
