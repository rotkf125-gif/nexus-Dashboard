// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - LocalStorage Management
// ═══════════════════════════════════════════════════════════════

import { Asset, Dividend, TimelineEntry, TradeSums, NexusState } from './types';
import { DEFAULT_ASSETS, DEFAULT_EXCHANGE_RATE } from './config';

const STORAGE_KEYS = {
  ASSETS: 'nexus_assets_v62',
  DIVIDENDS: 'nexus_dividends',
  TIMELINE: 'nexus_timeline',
  RATE: 'nexus_rate',
  TRADE_SUMS: 'nexus_trade_sums',
  SCRIPT_URL: 'nexus_script_url',
  STRATEGY: 'nexus_strategy',
  THEME: 'nexus_theme',
  COMPACT: 'nexus_compact',
  LAST_SNAPSHOT: 'nexus_last_snapshot',
};

// Safe JSON parse
function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Load state from localStorage
export function loadState(): Partial<NexusState> {
  if (!isBrowser) {
    return {
      assets: DEFAULT_ASSETS,
      dividends: [],
      timeline: [],
      exchangeRate: DEFAULT_EXCHANGE_RATE,
      tradeSums: { PLTY: 0, HOOY: 0 },
      scriptUrl: '',
      strategy: '',
      theme: 'dark',
      compactMode: false,
    };
  }

  return {
    assets: safeParse<Asset[]>(localStorage.getItem(STORAGE_KEYS.ASSETS), DEFAULT_ASSETS),
    dividends: safeParse<Dividend[]>(localStorage.getItem(STORAGE_KEYS.DIVIDENDS), []),
    timeline: safeParse<TimelineEntry[]>(localStorage.getItem(STORAGE_KEYS.TIMELINE), []),
    exchangeRate: parseFloat(localStorage.getItem(STORAGE_KEYS.RATE) || '') || DEFAULT_EXCHANGE_RATE,
    tradeSums: safeParse<TradeSums>(localStorage.getItem(STORAGE_KEYS.TRADE_SUMS), { PLTY: 0, HOOY: 0 }),
    scriptUrl: localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || '',
    strategy: localStorage.getItem(STORAGE_KEYS.STRATEGY) || '',
    theme: (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark',
    compactMode: localStorage.getItem(STORAGE_KEYS.COMPACT) === 'true',
  };
}

// Save state to localStorage
export function saveState(state: Partial<NexusState>): void {
  if (!isBrowser) return;

  if (state.assets) localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(state.assets));
  if (state.dividends) localStorage.setItem(STORAGE_KEYS.DIVIDENDS, JSON.stringify(state.dividends));
  if (state.timeline) localStorage.setItem(STORAGE_KEYS.TIMELINE, JSON.stringify(state.timeline));
  if (state.exchangeRate) localStorage.setItem(STORAGE_KEYS.RATE, state.exchangeRate.toString());
  if (state.tradeSums) localStorage.setItem(STORAGE_KEYS.TRADE_SUMS, JSON.stringify(state.tradeSums));
  if (state.scriptUrl !== undefined) localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, state.scriptUrl);
  if (state.strategy !== undefined) localStorage.setItem(STORAGE_KEYS.STRATEGY, state.strategy);
  if (state.theme) localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
  if (state.compactMode !== undefined) localStorage.setItem(STORAGE_KEYS.COMPACT, state.compactMode.toString());
}

// Clear all data
export function clearAllData(): void {
  if (!isBrowser) return;
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

// Export data as JSON
export function exportData(state: Partial<NexusState>): string {
  return JSON.stringify({
    assets: state.assets,
    dividends: state.dividends,
    timeline: state.timeline,
    tradeSums: state.tradeSums,
    exchangeRate: state.exchangeRate,
  }, null, 2);
}

// Import data from JSON
export function importData(jsonString: string): Partial<NexusState> | null {
  try {
    const data = JSON.parse(jsonString);
    return {
      assets: data.assets || [],
      dividends: data.dividends || [],
      timeline: data.timeline || [],
      tradeSums: data.tradeSums || {},
      exchangeRate: data.exchangeRate || DEFAULT_EXCHANGE_RATE,
    };
  } catch {
    return null;
  }
}
