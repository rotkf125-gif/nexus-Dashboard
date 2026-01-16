// ═══════════════════════════════════════════════════════════════
// NEXUS V1.7 - Price Refresh Hook
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react';
import { Asset, MarketData } from '../types';

interface UsePriceRefreshOptions {
  assets: Asset[];
  onAssetsUpdate: (assets: Asset[]) => void;
  onMarketUpdate: (market: Partial<MarketData>) => void;
  onPreviousPricesUpdate: (prices: Record<string, number>) => void;
  onLastSyncUpdate: (timestamp: number) => void;
}

interface UsePriceRefreshReturn {
  isFetching: boolean;
  refresh: () => Promise<void>;
  lastSync: number | null;
}

export function usePriceRefresh({
  assets,
  onAssetsUpdate,
  onMarketUpdate,
  onPreviousPricesUpdate,
  onLastSyncUpdate,
}: UsePriceRefreshOptions): UsePriceRefreshReturn {
  const [isFetching, setIsFetching] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);

  // Use ref to avoid stale closure issues
  const assetsRef = useRef(assets);
  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const refresh = useCallback(async () => {
    if (isFetching) return;

    setIsFetching(true);

    try {
      // Fetch market data
      const marketRes = await fetch('/api/market');
      if (marketRes.ok) {
        const marketData = await marketRes.json();
        onMarketUpdate(marketData);
      }

      // Capture previous prices
      const currentAssets = assetsRef.current;
      const previousPrices: Record<string, number> = {};
      currentAssets.forEach(a => {
        if (a.price > 0) previousPrices[a.ticker] = a.price;
      });
      onPreviousPricesUpdate(previousPrices);

      // Fetch asset prices in parallel
      const updatedAssets = await Promise.all(
        currentAssets.map(async (asset) => {
          try {
            const res = await fetch(`/api/price/${asset.ticker}`);
            if (res.ok) {
              const data = await res.json();
              return { ...asset, price: data.price };
            }
          } catch {
            // Keep original price on error
          }
          return asset;
        })
      );

      onAssetsUpdate(updatedAssets);

      const now = Date.now();
      setLastSync(now);
      onLastSyncUpdate(now);
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, onAssetsUpdate, onMarketUpdate, onPreviousPricesUpdate, onLastSyncUpdate]);

  return {
    isFetching,
    refresh,
    lastSync,
  };
}

// Auto-refresh hook with interval
interface UseAutoRefreshOptions extends UsePriceRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
}

export function useAutoRefresh({
  interval = 60000, // default 1 minute
  enabled = true,
  ...options
}: UseAutoRefreshOptions): UsePriceRefreshReturn {
  const { isFetching, refresh, lastSync } = usePriceRefresh(options);

  useEffect(() => {
    if (!enabled || interval <= 0) return;

    const timer = setInterval(refresh, interval);
    return () => clearInterval(timer);
  }, [enabled, interval, refresh]);

  return { isFetching, refresh, lastSync };
}
