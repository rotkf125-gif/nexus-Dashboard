'use client';

// ═══════════════════════════════════════════════════════════════
// Contexts Index - 통합 Provider 및 호환성 훅
// ═══════════════════════════════════════════════════════════════

import React, { ReactNode } from 'react';
import { SharedProvider, useShared } from './SharedContext';
import { PortfolioProvider, usePortfolioContext } from './PortfolioContext';
import { DividendProvider, useDividendContext } from './DividendContext';
import { TradeProvider, useTradeContext } from './TradeContext';
import { MarketProvider, useMarketContext } from './MarketContext';
import { UIProvider, useUIContext } from './UIContext';

// Re-export individual contexts
export { SharedProvider, useShared } from './SharedContext';
export { PortfolioProvider, usePortfolioContext } from './PortfolioContext';
export { DividendProvider, useDividendContext } from './DividendContext';
export { TradeProvider, useTradeContext } from './TradeContext';
export { MarketProvider, useMarketContext } from './MarketContext';
export { UIProvider, useUIContext } from './UIContext';

// 내부 Provider 조합 (UIContext가 toast를 제공하므로 DividendProvider에 전달)
function InnerProviders({ children }: { children: ReactNode }) {
  const { toast } = useUIContext();

  return (
    <DividendProvider toast={toast}>
      {children}
    </DividendProvider>
  );
}

// 통합 AppProviders
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SharedProvider>
      <MarketProvider>
        <PortfolioProvider>
          <TradeProvider>
            <UIProvider>
              <InnerProviders>
                {children}
              </InnerProviders>
            </UIProvider>
          </TradeProvider>
        </PortfolioProvider>
      </MarketProvider>
    </SharedProvider>
  );
}

// 기존 useNexus 호환 훅 - 모든 Context를 통합하여 기존 인터페이스 유지
export function useNexus() {
  const shared = useShared();
  const portfolio = usePortfolioContext();
  const dividend = useDividendContext();
  const trade = useTradeContext();
  const market = useMarketContext();
  const ui = useUIContext();

  return {
    // 전체 상태 (기존 호환성)
    state: shared.state,

    // Portfolio actions
    updateAssets: portfolio.updateAssets,
    addAsset: portfolio.addAsset,
    removeAsset: portfolio.removeAsset,
    updateAsset: portfolio.updateAsset,
    refreshPrices: portfolio.refreshPrices,

    // Dividend actions
    addDividend: dividend.addDividend,
    removeDividend: dividend.removeDividend,
    syncFromSheet: dividend.syncFromSheet,

    // Trade actions
    addTradeLog: trade.addTradeLog,
    updateTradeLog: trade.updateTradeLog,
    removeTradeLog: trade.removeTradeLog,
    setTradeSums: trade.setTradeSums,
    removeTradeSum: trade.removeTradeSum,

    // Market actions
    updateMarket: market.updateMarket,
    setExchangeRate: market.setExchangeRate,

    // UI actions
    setTheme: ui.setTheme,
    setCompactMode: ui.setCompactMode,
    setStrategy: ui.setStrategy,
    toast: ui.toast,

    // Asset Modal states
    assetModalOpen: ui.assetModalOpen,
    setAssetModalOpen: ui.setAssetModalOpen,
    editingAsset: ui.editingAsset,
    editingIndex: ui.editingIndex,
    openAddAssetModal: ui.openAddAssetModal,
    openEditAssetModal: ui.openEditAssetModal,
    closeAssetModal: ui.closeAssetModal,
    saveAssetFromModal: ui.saveAssetFromModal,

    // Dividend Modal states
    dividendModalOpen: ui.dividendModalOpen,
    setDividendModalOpen: ui.setDividendModalOpen,
    openDividendModal: ui.openDividendModal,
    closeDividendModal: ui.closeDividendModal,

    // Sync status
    isSyncing: ui.isSyncing,

    // Undo/Redo
    undo: ui.undo,
    redo: ui.redo,
    canUndo: ui.canUndo,
    canRedo: ui.canRedo,
    undoCount: ui.undoCount,
    redoCount: ui.redoCount,
  };
}

// 기존 NexusProvider 호환 - AppProviders로 래핑
export function NexusProvider({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
