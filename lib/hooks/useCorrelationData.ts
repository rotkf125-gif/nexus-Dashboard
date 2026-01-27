'use client';

import { useMemo } from 'react';
import { Asset } from '@/lib/types';

interface CorrelationMatrix {
  labels: string[];
  data: number[][];
}

// Pre-defined sector correlations (based on historical data)
const SECTOR_CORRELATIONS: Record<string, Record<string, number>> = {
  Technology: {
    Technology: 1.0,
    'Consumer Cyclical': 0.75,
    'Communication Services': 0.72,
    'Financial Services': 0.65,
    Healthcare: 0.55,
    Industrials: 0.60,
    'Consumer Defensive': 0.45,
    Energy: 0.35,
    Utilities: 0.30,
    'Real Estate': 0.40,
    'Basic Materials': 0.50,
  },
  'Financial Services': {
    Technology: 0.65,
    'Consumer Cyclical': 0.70,
    'Communication Services': 0.60,
    'Financial Services': 1.0,
    Healthcare: 0.50,
    Industrials: 0.72,
    'Consumer Defensive': 0.55,
    Energy: 0.55,
    Utilities: 0.45,
    'Real Estate': 0.60,
    'Basic Materials': 0.55,
  },
  Healthcare: {
    Technology: 0.55,
    'Consumer Cyclical': 0.45,
    'Communication Services': 0.50,
    'Financial Services': 0.50,
    Healthcare: 1.0,
    Industrials: 0.48,
    'Consumer Defensive': 0.65,
    Energy: 0.30,
    Utilities: 0.45,
    'Real Estate': 0.35,
    'Basic Materials': 0.40,
  },
  Energy: {
    Technology: 0.35,
    'Consumer Cyclical': 0.50,
    'Communication Services': 0.35,
    'Financial Services': 0.55,
    Healthcare: 0.30,
    Industrials: 0.65,
    'Consumer Defensive': 0.40,
    Energy: 1.0,
    Utilities: 0.55,
    'Real Estate': 0.30,
    'Basic Materials': 0.75,
  },
  'Consumer Cyclical': {
    Technology: 0.75,
    'Consumer Cyclical': 1.0,
    'Communication Services': 0.70,
    'Financial Services': 0.70,
    Healthcare: 0.45,
    Industrials: 0.72,
    'Consumer Defensive': 0.55,
    Energy: 0.50,
    Utilities: 0.35,
    'Real Estate': 0.45,
    'Basic Materials': 0.60,
  },
  'Consumer Defensive': {
    Technology: 0.45,
    'Consumer Cyclical': 0.55,
    'Communication Services': 0.50,
    'Financial Services': 0.55,
    Healthcare: 0.65,
    Industrials: 0.50,
    'Consumer Defensive': 1.0,
    Energy: 0.40,
    Utilities: 0.60,
    'Real Estate': 0.45,
    'Basic Materials': 0.45,
  },
  Industrials: {
    Technology: 0.60,
    'Consumer Cyclical': 0.72,
    'Communication Services': 0.55,
    'Financial Services': 0.72,
    Healthcare: 0.48,
    Industrials: 1.0,
    'Consumer Defensive': 0.50,
    Energy: 0.65,
    Utilities: 0.50,
    'Real Estate': 0.50,
    'Basic Materials': 0.70,
  },
  Utilities: {
    Technology: 0.30,
    'Consumer Cyclical': 0.35,
    'Communication Services': 0.40,
    'Financial Services': 0.45,
    Healthcare: 0.45,
    Industrials: 0.50,
    'Consumer Defensive': 0.60,
    Energy: 0.55,
    Utilities: 1.0,
    'Real Estate': 0.55,
    'Basic Materials': 0.45,
  },
  'Real Estate': {
    Technology: 0.40,
    'Consumer Cyclical': 0.45,
    'Communication Services': 0.45,
    'Financial Services': 0.60,
    Healthcare: 0.35,
    Industrials: 0.50,
    'Consumer Defensive': 0.45,
    Energy: 0.30,
    Utilities: 0.55,
    'Real Estate': 1.0,
    'Basic Materials': 0.40,
  },
  'Communication Services': {
    Technology: 0.72,
    'Consumer Cyclical': 0.70,
    'Communication Services': 1.0,
    'Financial Services': 0.60,
    Healthcare: 0.50,
    Industrials: 0.55,
    'Consumer Defensive': 0.50,
    Energy: 0.35,
    Utilities: 0.40,
    'Real Estate': 0.45,
    'Basic Materials': 0.45,
  },
  'Basic Materials': {
    Technology: 0.50,
    'Consumer Cyclical': 0.60,
    'Communication Services': 0.45,
    'Financial Services': 0.55,
    Healthcare: 0.40,
    Industrials: 0.70,
    'Consumer Defensive': 0.45,
    Energy: 0.75,
    Utilities: 0.45,
    'Real Estate': 0.40,
    'Basic Materials': 1.0,
  },
};

export function useCorrelationData(
  assets: Asset[],
  viewMode: 'asset' | 'sector' = 'sector'
): CorrelationMatrix {
  return useMemo(() => {
    if (viewMode === 'sector') {
      // Get unique sectors from portfolio
      const sectors = Array.from(new Set(assets.map((a) => a.sector))).filter(Boolean);

      if (sectors.length === 0) {
        return { labels: [], data: [] };
      }

      const matrix: number[][] = [];
      sectors.forEach((sector1) => {
        const row: number[] = [];
        sectors.forEach((sector2) => {
          const correlation =
            SECTOR_CORRELATIONS[sector1]?.[sector2] ??
            SECTOR_CORRELATIONS[sector2]?.[sector1] ??
            (sector1 === sector2 ? 1.0 : 0.5);
          row.push(correlation);
        });
        matrix.push(row);
      });

      return { labels: sectors, data: matrix };
    } else {
      // Asset-level correlation (based on sector correlation as proxy)
      const tickers = assets.map((a) => a.ticker);

      if (tickers.length === 0) {
        return { labels: [], data: [] };
      }

      const matrix: number[][] = [];
      assets.forEach((asset1) => {
        const row: number[] = [];
        assets.forEach((asset2) => {
          if (asset1.ticker === asset2.ticker) {
            row.push(1.0);
          } else {
            const sectorCorr =
              SECTOR_CORRELATIONS[asset1.sector]?.[asset2.sector] ??
              SECTOR_CORRELATIONS[asset2.sector]?.[asset1.sector] ??
              0.5;
            // Add some noise for asset-level variation
            const noise = (Math.random() - 0.5) * 0.1;
            row.push(Math.max(-1, Math.min(1, sectorCorr + noise)));
          }
        });
        matrix.push(row);
      });

      return { labels: tickers, data: matrix };
    }
  }, [assets, viewMode]);
}

export function getCorrelationColor(value: number): string {
  if (value >= 0.8) return '#dc2626'; // Strong positive - red
  if (value >= 0.6) return '#f97316'; // Moderate positive - orange
  if (value >= 0.4) return '#fbbf24'; // Weak positive - amber
  if (value >= 0.2) return '#fef3c7'; // Very weak positive - light amber
  if (value >= -0.2) return '#f5f5f5'; // Near zero - white
  if (value >= -0.4) return '#bfdbfe'; // Weak negative - light blue
  if (value >= -0.6) return '#60a5fa'; // Moderate negative - blue
  if (value >= -0.8) return '#3b82f6'; // Strong negative - darker blue
  return '#1d4ed8'; // Very strong negative - dark blue
}

export default useCorrelationData;
