'use client';

// ═══════════════════════════════════════════════════════════════
// Dividend Context - 배당 관리
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useCallback, ReactNode } from 'react';
import { Dividend } from '../types';
import { isValidGoogleScriptUrl } from '../utils';
import { useShared } from './SharedContext';
import { DividendContextType } from './types';

const DividendContext = createContext<DividendContextType | null>(null);

interface DividendProviderProps {
  children: ReactNode;
  toast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
}

export function DividendProvider({ children, toast }: DividendProviderProps) {
  const { state, setState, saveToHistory } = useShared();

  const addDividend = useCallback((dividend: Dividend) => {
    setState(prev => {
      saveToHistory(prev);
      return { ...prev, dividends: [...prev.dividends, dividend] };
    });
  }, [setState, saveToHistory]);

  const removeDividend = useCallback((index: number) => {
    setState(prev => {
      saveToHistory(prev);
      return {
        ...prev,
        dividends: prev.dividends.filter((_, i) => i !== index),
      };
    });
  }, [setState, saveToHistory]);

  const syncFromSheet = useCallback(async () => {
    const scriptUrl = localStorage.getItem('nexus_script_url');

    if (!scriptUrl || scriptUrl.trim() === '') {
      toast('설정에서 Google Script URL을 입력하세요', 'warning');
      return;
    }

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

          let dividends: Array<{ date: string; ticker: string; dps: number; qty: number }> = [];
          let tradeSumsData = null;

          if (Array.isArray(data)) {
            dividends = data;
          } else if (data.dividends && Array.isArray(data.dividends)) {
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
  }, [setState, toast]);

  return (
    <DividendContext.Provider
      value={{
        dividends: state.dividends,
        addDividend,
        removeDividend,
        syncFromSheet,
      }}
    >
      {children}
    </DividendContext.Provider>
  );
}

export function useDividendContext() {
  const context = useContext(DividendContext);
  if (!context) {
    throw new Error('useDividendContext must be used within DividendProvider');
  }
  return context;
}
