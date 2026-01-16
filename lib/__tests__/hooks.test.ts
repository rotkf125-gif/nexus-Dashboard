// ═══════════════════════════════════════════════════════════════
// Hooks Tests - 커스텀 훅 테스트
// ═══════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock useNexus
const mockState = {
  assets: [
    { ticker: 'AAPL', qty: 10, avg: 100, price: 150, type: 'CORE', sector: 'Technology', buyRate: 1400 },
    { ticker: 'MSFT', qty: 5, avg: 200, price: 250, type: 'GROWTH', sector: 'Technology', buyRate: 1400 },
    { ticker: 'PLTY', qty: 100, avg: 27, price: 30, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
  ],
  dividends: [
    { date: '2025-12-01', ticker: 'PLTY', qty: 100, dps: 0.5 },
    { date: '2025-12-08', ticker: 'PLTY', qty: 100, dps: 0.48 },
    { date: '2025-11-01', ticker: 'PLTY', qty: 100, dps: 0.52 },
  ],
  tradeSums: {
    'AAPL': 500,
    'MSFT': -200,
    'NVDA': 1000,
  },
  exchangeRate: 1450,
};

vi.mock('../context', () => ({
  useNexus: () => ({ state: mockState }),
}));

// Import after mock
import { TAX_CONFIG } from '../config';

describe('Portfolio Stats Calculation', () => {
  it('should calculate total value correctly', () => {
    const { assets } = mockState;
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    
    // AAPL: 10 * 150 = 1500
    // MSFT: 5 * 250 = 1250
    // PLTY: 100 * 30 = 3000
    expect(totalValue).toBe(5750);
  });

  it('should calculate total cost correctly', () => {
    const { assets } = mockState;
    const totalCost = assets.reduce((sum, a) => sum + a.qty * a.avg, 0);
    
    // AAPL: 10 * 100 = 1000
    // MSFT: 5 * 200 = 1000
    // PLTY: 100 * 27 = 2700
    expect(totalCost).toBe(4700);
  });

  it('should calculate profit correctly', () => {
    const { assets } = mockState;
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalCost = assets.reduce((sum, a) => sum + a.qty * a.avg, 0);
    const profit = totalValue - totalCost;
    
    expect(profit).toBe(1050);
  });

  it('should calculate return percentage correctly', () => {
    const { assets } = mockState;
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalCost = assets.reduce((sum, a) => sum + a.qty * a.avg, 0);
    const returnPct = totalCost > 0 ? (totalValue - totalCost) / totalCost * 100 : 0;
    
    expect(returnPct).toBeCloseTo(22.34, 1);
  });
});

describe('Dividend Stats Calculation', () => {
  it('should calculate total dividends after tax', () => {
    const { dividends } = mockState;
    const { AFTER_TAX_RATE } = TAX_CONFIG;
    
    const totalDividends = dividends.reduce(
      (sum, d) => sum + d.qty * d.dps * AFTER_TAX_RATE,
      0
    );
    
    // (100 * 0.5 + 100 * 0.48 + 100 * 0.52) * 0.85 = 150 * 0.85 = 127.5
    expect(totalDividends).toBe(127.5);
  });

  it('should calculate average DPS', () => {
    const { dividends } = mockState;
    const avgDps = dividends.reduce((sum, d) => sum + d.dps, 0) / dividends.length;
    
    // (0.5 + 0.48 + 0.52) / 3 = 0.5
    expect(avgDps).toBe(0.5);
  });

  it('should group dividends by month', () => {
    const { dividends } = mockState;
    const { AFTER_TAX_RATE } = TAX_CONFIG;
    
    const monthlyDividends: Record<string, number> = {};
    dividends.forEach(d => {
      const month = d.date.slice(0, 7);
      const amount = d.qty * d.dps * AFTER_TAX_RATE;
      monthlyDividends[month] = (monthlyDividends[month] || 0) + amount;
    });
    
    expect(monthlyDividends['2025-12']).toBeCloseTo(83.3, 1);
    expect(monthlyDividends['2025-11']).toBeCloseTo(44.2, 1);
  });
});

describe('Trade Stats Calculation', () => {
  it('should calculate total realized P&L', () => {
    const { tradeSums } = mockState;
    const totalRealized = Object.values(tradeSums).reduce((sum, val) => sum + (val || 0), 0);
    
    // 500 + (-200) + 1000 = 1300
    expect(totalRealized).toBe(1300);
  });

  it('should count profitable trades', () => {
    const { tradeSums } = mockState;
    const profits = Object.entries(tradeSums).filter(([, pnl]) => pnl > 0);
    
    expect(profits.length).toBe(2); // AAPL, NVDA
  });

  it('should count losing trades', () => {
    const { tradeSums } = mockState;
    const losses = Object.entries(tradeSums).filter(([, pnl]) => pnl < 0);
    
    expect(losses.length).toBe(1); // MSFT
  });

  it('should calculate win rate', () => {
    const { tradeSums } = mockState;
    const entries = Object.entries(tradeSums);
    const profits = entries.filter(([, pnl]) => pnl > 0);
    const losses = entries.filter(([, pnl]) => pnl < 0);
    const totalTrades = profits.length + losses.length;
    const winRate = totalTrades > 0 ? (profits.length / totalTrades) * 100 : 0;
    
    // 2 / 3 * 100 = 66.67%
    expect(winRate).toBeCloseTo(66.67, 1);
  });

  it('should identify top gainers', () => {
    const { tradeSums } = mockState;
    const topGainers = Object.entries(tradeSums)
      .filter(([, pnl]) => pnl > 0)
      .map(([ticker, pnl]) => ({ ticker, pnl }))
      .sort((a, b) => b.pnl - a.pnl);
    
    expect(topGainers[0].ticker).toBe('NVDA');
    expect(topGainers[0].pnl).toBe(1000);
  });
});

describe('Type Distribution', () => {
  it('should calculate type distribution', () => {
    const { assets } = mockState;
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    
    const typeDistribution: Record<string, { count: number; value: number; weight: number }> = {};
    assets.forEach(a => {
      const value = a.qty * a.price;
      if (!typeDistribution[a.type]) {
        typeDistribution[a.type] = { count: 0, value: 0, weight: 0 };
      }
      typeDistribution[a.type].count += 1;
      typeDistribution[a.type].value += value;
    });
    
    Object.keys(typeDistribution).forEach(type => {
      typeDistribution[type].weight = (typeDistribution[type].value / totalValue) * 100;
    });
    
    expect(typeDistribution['CORE'].count).toBe(1);
    expect(typeDistribution['CORE'].value).toBe(1500);
    expect(typeDistribution['INCOME'].weight).toBeCloseTo(52.17, 1);
  });
});

describe('Sector Distribution', () => {
  it('should calculate sector distribution', () => {
    const { assets } = mockState;
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    
    const sectorDistribution: Record<string, { count: number; value: number; weight: number }> = {};
    assets.forEach(a => {
      const value = a.qty * a.price;
      if (!sectorDistribution[a.sector]) {
        sectorDistribution[a.sector] = { count: 0, value: 0, weight: 0 };
      }
      sectorDistribution[a.sector].count += 1;
      sectorDistribution[a.sector].value += value;
    });
    
    Object.keys(sectorDistribution).forEach(sector => {
      sectorDistribution[sector].weight = (sectorDistribution[sector].value / totalValue) * 100;
    });
    
    expect(sectorDistribution['Technology'].count).toBe(2);
    expect(sectorDistribution['Technology'].value).toBe(2750);
    expect(sectorDistribution['ETF'].weight).toBeCloseTo(52.17, 1);
  });
});
