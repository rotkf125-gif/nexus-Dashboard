'use client';

// ═══════════════════════════════════════════════════════════════
// UI Context - 모달, 테마, 토스트 관리
// ═══════════════════════════════════════════════════════════════

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Asset } from '../types';
import { UI_CONFIG } from '../config';
import { useShared } from './SharedContext';
import { UIContextType } from './types';

const UIContext = createContext<UIContextType | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const { state, setState, saveToHistory, isSyncing, undo, redo, canUndo, canRedo, undoCount, redoCount } = useShared();

  // Asset Modal states
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Dividend Modal states
  const [dividendModalOpen, setDividendModalOpen] = useState(false);

  // Toast function
  const toast = useCallback((message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons: Record<string, string> = { success: 'check', danger: 'times', warning: 'exclamation', info: 'info' };
    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${type}`;
    toastEl.style.borderColor = `var(--${type === 'danger' ? 'danger' : type})`;

    const iconWrapper = document.createElement('div');
    iconWrapper.style.cssText = 'width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1)';
    const icon = document.createElement('i');
    icon.className = `fas fa-${icons[type]}`;
    icon.style.fontSize = '10px';
    iconWrapper.appendChild(icon);

    const messageSpan = document.createElement('span');
    messageSpan.style.color = 'rgba(255,255,255,0.9)';
    messageSpan.textContent = message;

    toastEl.appendChild(iconWrapper);
    toastEl.appendChild(messageSpan);
    container.appendChild(toastEl);

    setTimeout(() => {
      toastEl.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toastEl.remove(), 300);
    }, UI_CONFIG.TOAST_DURATION);
  }, []);

  // Theme functions
  const setTheme = useCallback((theme: 'dark' | 'light') => {
    setState(prev => ({ ...prev, theme }));
    document.documentElement.className = theme;
  }, [setState]);

  const setCompactMode = useCallback((compactMode: boolean) => {
    setState(prev => ({ ...prev, compactMode }));
  }, [setState]);

  const setStrategy = useCallback((strategy: string) => {
    setState(prev => ({ ...prev, strategy }));
  }, [setState]);

  // Asset Modal functions
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
      setState(prev => {
        saveToHistory(prev);
        return {
          ...prev,
          assets: prev.assets.map((a, i) => (i === editingIndex ? { ...a, ...asset } : a)),
        };
      });
      toast('Asset updated', 'success');
    } else {
      setState(prev => {
        saveToHistory(prev);
        return { ...prev, assets: [...prev.assets, asset] };
      });
      toast('Asset added', 'success');
    }
    closeAssetModal();
  }, [editingIndex, setState, saveToHistory, closeAssetModal, toast]);

  // Dividend Modal functions
  const openDividendModal = useCallback(() => {
    setDividendModalOpen(true);
  }, []);

  const closeDividendModal = useCallback(() => {
    setDividendModalOpen(false);
  }, []);

  return (
    <UIContext.Provider
      value={{
        theme: state.theme,
        compactMode: state.compactMode,
        strategy: state.strategy,
        setTheme,
        setCompactMode,
        setStrategy,
        toast,
        // Asset Modal
        assetModalOpen,
        setAssetModalOpen,
        editingAsset,
        editingIndex,
        openAddAssetModal,
        openEditAssetModal,
        closeAssetModal,
        saveAssetFromModal,
        // Dividend Modal
        dividendModalOpen,
        setDividendModalOpen,
        openDividendModal,
        closeDividendModal,
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
    </UIContext.Provider>
  );
}

export function useUIContext() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIContext must be used within UIProvider');
  }
  return context;
}
