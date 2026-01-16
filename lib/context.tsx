'use client';

// ═══════════════════════════════════════════════════════════════
// NEXUS Context - 호환성 레이어
// 기존 코드와의 호환성을 위해 분리된 Context들을 re-export
// ═══════════════════════════════════════════════════════════════

// 분리된 Context들에서 모든 것을 re-export
export {
  // Providers
  NexusProvider,
  AppProviders,
  SharedProvider,
  PortfolioProvider,
  DividendProvider,
  TradeProvider,
  MarketProvider,
  UIProvider,

  // Hooks
  useNexus,
  useShared,
  usePortfolioContext,
  useDividendContext,
  useTradeContext,
  useMarketContext,
  useUIContext,
} from './contexts';
