// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Supabase Storage Management
// ═══════════════════════════════════════════════════════════════

import { Asset, Dividend, TimelineEntry, TradeSums, NexusState } from './types';
import { DEFAULT_ASSETS, DEFAULT_EXCHANGE_RATE } from './config';
import { supabase, getUserId } from './supabase';

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Default state
const DEFAULT_STATE: Partial<NexusState> = {
  assets: DEFAULT_ASSETS,
  dividends: [],
  timeline: [],
  exchangeRate: DEFAULT_EXCHANGE_RATE,
  tradeSums: {},
  scriptUrl: '',
  strategy: '',
  theme: 'dark',
  compactMode: false,
};

// ═══════════════════════════════════════════════════════════════
// SUPABASE OPERATIONS
// ═══════════════════════════════════════════════════════════════

// Load state from Supabase
export async function loadStateFromSupabase(): Promise<Partial<NexusState>> {
  if (!isBrowser) return DEFAULT_STATE;

  try {
    const userId = getUserId();
    
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // 데이터가 없으면 새로 생성
      if (error.code === 'PGRST116') {
        console.log('No existing data, creating new portfolio...');
        await createInitialPortfolio(userId);
        return DEFAULT_STATE;
      }
      throw error;
    }

    return {
      assets: data.assets || DEFAULT_ASSETS,
      dividends: data.dividends || [],
      timeline: [],
      exchangeRate: data.exchange_rate || DEFAULT_EXCHANGE_RATE,
      tradeSums: data.trade_sums || {},
      scriptUrl: localStorage.getItem('nexus_script_url') || '', // URL은 로컬에 유지
      strategy: data.strategy || '',
      theme: data.theme || 'dark',
      compactMode: data.compact_mode || false,
    };
  } catch (error) {
    console.error('Failed to load from Supabase:', error);
    // Fallback to localStorage
    return loadStateFromLocalStorage();
  }
}

// Save state to Supabase
export async function saveStateToSupabase(state: Partial<NexusState>): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const userId = getUserId();

    const { error } = await supabase
      .from('portfolios')
      .upsert({
        user_id: userId,
        assets: state.assets,
        dividends: state.dividends,
        trade_sums: state.tradeSums,
        market: state.market,
        exchange_rate: state.exchangeRate,
        strategy: state.strategy,
        compact_mode: state.compactMode,
        theme: state.theme,
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
    
    // Script URL은 로컬에 저장
    if (state.scriptUrl !== undefined) {
      localStorage.setItem('nexus_script_url', state.scriptUrl);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save to Supabase:', error);
    // Fallback: localStorage에도 저장
    saveStateToLocalStorage(state);
    return false;
  }
}

// Create initial portfolio
async function createInitialPortfolio(userId: string): Promise<void> {
  try {
    await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        assets: DEFAULT_ASSETS,
        dividends: [],
        trade_sums: {},
        exchange_rate: DEFAULT_EXCHANGE_RATE,
        strategy: '',
        compact_mode: false,
        theme: 'dark',
      });
  } catch (error) {
    console.error('Failed to create initial portfolio:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// LOCALSTORAGE FALLBACK
// ═══════════════════════════════════════════════════════════════

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
};

function safeParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// Load from localStorage (fallback)
function loadStateFromLocalStorage(): Partial<NexusState> {
  if (!isBrowser) return DEFAULT_STATE;

  return {
    assets: safeParse<Asset[]>(localStorage.getItem(STORAGE_KEYS.ASSETS), DEFAULT_ASSETS),
    dividends: safeParse<Dividend[]>(localStorage.getItem(STORAGE_KEYS.DIVIDENDS), []),
    timeline: safeParse<TimelineEntry[]>(localStorage.getItem(STORAGE_KEYS.TIMELINE), []),
    exchangeRate: parseFloat(localStorage.getItem(STORAGE_KEYS.RATE) || '') || DEFAULT_EXCHANGE_RATE,
    tradeSums: safeParse<TradeSums>(localStorage.getItem(STORAGE_KEYS.TRADE_SUMS), {}),
    scriptUrl: localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || '',
    strategy: localStorage.getItem(STORAGE_KEYS.STRATEGY) || '',
    theme: (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark',
    compactMode: localStorage.getItem(STORAGE_KEYS.COMPACT) === 'true',
  };
}

// Save to localStorage (fallback)
function saveStateToLocalStorage(state: Partial<NexusState>): void {
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

// ═══════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════

// Sync version (uses localStorage, deprecated)
export function loadState(): Partial<NexusState> {
  return loadStateFromLocalStorage();
}

export function saveState(state: Partial<NexusState>): void {
  saveStateToLocalStorage(state);
}

// Clear all data
export async function clearAllData(): Promise<void> {
  if (!isBrowser) return;
  
  // Clear localStorage
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  
  // Clear Supabase
  try {
    const userId = getUserId();
    await supabase
      .from('portfolios')
      .delete()
      .eq('user_id', userId);
  } catch (error) {
    console.error('Failed to clear Supabase data:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT HISTORY (30분 간격 히스토리 저장)
// ═══════════════════════════════════════════════════════════════

export async function saveSnapshot(state: NexusState): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const userId = getUserId();
    
    // 총 평가금/원금 계산
    let totalValue = 0;
    let totalCost = 0;
    state.assets.forEach(a => {
      totalValue += a.qty * a.price;
      totalCost += a.qty * a.avg;
    });
    const returnPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    const { error } = await supabase
      .from('portfolio_snapshots')
      .insert({
        user_id: userId,
        total_value: totalValue,
        total_cost: totalCost,
        return_pct: returnPct,
        exchange_rate: state.exchangeRate,
        assets: state.assets,
        market: state.market,
      });

    if (error) throw error;
    console.log('📸 Snapshot saved:', new Date().toLocaleTimeString());
    return true;
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    return false;
  }
}

// 스냅샷 히스토리 조회
export async function loadSnapshots(limit: number = 48): Promise<any[]> {
  if (!isBrowser) return [];

  try {
    const userId = getUserId();
    
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to load snapshots:', error);
    return [];
  }
}

// Export data as JSON
export function exportData(state: Partial<NexusState>): string {
  return JSON.stringify({
    assets: state.assets,
    dividends: state.dividends,
    timeline: state.timeline,
    tradeSums: state.tradeSums,
    exchangeRate: state.exchangeRate,
    strategy: state.strategy,
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
      strategy: data.strategy || '',
    };
  } catch {
    return null;
  }
}
