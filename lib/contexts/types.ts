// ═══════════════════════════════════════════════════════════════
// Context Types - 분리된 Context들의 공통 타입 정의
// ═══════════════════════════════════════════════════════════════

import { NexusState, Asset, Dividend, MarketData, TradeLog, TradeSums } from '../types';

// 공유 상태 타입 (모든 Context에서 접근 가능)
export interface SharedState {
  state: NexusState;
  setState: React.Dispatch<React.SetStateAction<NexusState>>;
  isLoaded: boolean;
  saveToHistory: (currentState: NexusState) => void;
}

// Portfolio Context 타입
export interface PortfolioContextType {
  assets: Asset[];
  previousPrices: Record<string, number>;
  updateAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (index: number) => void;
  updateAsset: (index: number, asset: Partial<Asset>) => void;
  refreshPrices: () => Promise<void>;
  isFetching: boolean;
}

// Dividend Context 타입
export interface DividendContextType {
  dividends: Dividend[];
  addDividend: (dividend: Dividend) => void;
  removeDividend: (index: number) => void;
  syncFromSheet: () => Promise<void>;
}

// Trade Context 타입
export interface TradeContextType {
  tradeLogs: TradeLog[];
  tradeSums: TradeSums;
  addTradeLog: (trade: TradeLog) => void;
  updateTradeLog: (id: string, trade: TradeLog) => void;
  removeTradeLog: (id: string) => void;
  setTradeSums: (ticker: string, amount: number) => void;
  removeTradeSum: (ticker: string) => void;
  calculateTradeReturns: (tradeLogs: TradeLog[]) => TradeSums;
}

// Market Context 타입
export interface MarketContextType {
  market: MarketData;
  previousMarket: MarketData;
  exchangeRate: number;
  updateMarket: (market: Partial<MarketData>) => void;
  setExchangeRate: (rate: number) => void;
}

// UI Context 타입
export interface UIContextType {
  theme: 'dark' | 'light';
  compactMode: boolean;
  strategy: string;
  setTheme: (theme: 'dark' | 'light') => void;
  setCompactMode: (compact: boolean) => void;
  setStrategy: (strategy: string) => void;
  toast: (message: string, type?: 'success' | 'danger' | 'warning' | 'info') => void;
  // Asset Modal
  assetModalOpen: boolean;
  setAssetModalOpen: (open: boolean) => void;
  editingAsset: Asset | null;
  editingIndex: number | null;
  openAddAssetModal: () => void;
  openEditAssetModal: (index: number) => void;
  closeAssetModal: () => void;
  saveAssetFromModal: (asset: Asset) => void;
  // Dividend Modal
  dividendModalOpen: boolean;
  setDividendModalOpen: (open: boolean) => void;
  openDividendModal: () => void;
  closeDividendModal: () => void;
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
