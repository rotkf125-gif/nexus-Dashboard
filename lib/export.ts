// ═══════════════════════════════════════════════════════════════
// NEXUS Export Utilities - Gems 최적화 Export
// ═══════════════════════════════════════════════════════════════

import { NexusState, Asset, Dividend } from './types';
import { getVixLevel } from './config';
import { TAX_CONFIG } from './config';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ExportFormat = 'gems-full' | 'gems-quick' | 'gems-income' | 'gems-rebalance' | 'json-raw';

export interface ExportOption {
  id: ExportFormat;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'gems-full',
    name: '전체 분석',
    icon: 'microscope',
    description: 'Freedom V30 Gems용 전체 데이터',
    color: 'celestial-cyan',
  },
  {
    id: 'gems-quick',
    name: '빠른 요약',
    icon: 'bolt',
    description: '핵심 지표만 (30초 분석용)',
    color: 'celestial-gold',
  },
  {
    id: 'gems-income',
    name: '배당 분석',
    icon: 'coins',
    description: '배당/인컴 중심 데이터',
    color: 'v64-success',
  },
  {
    id: 'gems-rebalance',
    name: '리밸런싱',
    icon: 'balance-scale',
    description: '포트폴리오 최적화 분석용',
    color: 'celestial-purple',
  },
  {
    id: 'json-raw',
    name: 'JSON',
    icon: 'code',
    description: '원본 JSON 데이터 (개발용)',
    color: 'white/50',
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalValueKrw: number;
  totalCostKrw: number;
}

interface GroupStats {
  name: string;
  weight: string;
  returnPct: string;
  valueUsd: number;
  assetCount: number;
}

function calculatePortfolioStats(state: NexusState): PortfolioStats {
  let totalCost = 0, totalValue = 0, totalCostKrw = 0, totalValueKrw = 0;
  
  state.assets.forEach(a => {
    const cost = a.qty * a.avg;
    const value = a.qty * a.price;
    const buyRate = a.buyRate || state.exchangeRate;
    totalCost += cost;
    totalValue += value;
    totalCostKrw += Math.round(cost * buyRate);
    totalValueKrw += Math.round(value * state.exchangeRate);
  });

  return { totalValue, totalCost, totalValueKrw, totalCostKrw };
}

function groupAssets(assets: Asset[], key: 'sector' | 'type', totalValue: number): GroupStats[] {
  const groups: Record<string, { value: number; cost: number; count: number }> = {};
  
  assets.forEach(a => {
    const groupKey = a[key] || 'Other';
    if (!groups[groupKey]) groups[groupKey] = { value: 0, cost: 0, count: 0 };
    groups[groupKey].value += a.price * a.qty;
    groups[groupKey].cost += a.avg * a.qty;
    groups[groupKey].count += 1;
  });
  
  return Object.entries(groups)
    .map(([name, data]) => ({
      name,
      weight: totalValue > 0 ? (data.value / totalValue * 100).toFixed(1) + '%' : '0%',
      returnPct: data.cost > 0 ? ((data.value - data.cost) / data.cost * 100).toFixed(2) + '%' : '0%',
      valueUsd: Math.round(data.value),
      assetCount: data.count
    }))
    .sort((a, b) => parseFloat(b.weight) - parseFloat(a.weight));
}

function calculateDividendStats(dividends: Dividend[], assets: Asset[]) {
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  
  const recentDividends = dividends.filter(d => new Date(d.date) >= oneYearAgo);
  const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + (d.qty * d.dps), 0);
  const afterTaxDividend = totalAnnualDividend * TAX_CONFIG.AFTER_TAX_RATE;
  
  // 월별 배당금 집계
  const monthlyDividends: Record<string, number> = {};
  recentDividends.forEach(d => {
    const monthKey = d.date.substring(0, 7);
    monthlyDividends[monthKey] = (monthlyDividends[monthKey] || 0) + (d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE);
  });
  
  // 티커별 배당 집계
  const dividendsByTicker: Record<string, number> = {};
  recentDividends.forEach(d => {
    dividendsByTicker[d.ticker] = (dividendsByTicker[d.ticker] || 0) + (d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE);
  });
  
  return {
    totalAnnualDividend,
    afterTaxDividend,
    monthlyDividends,
    dividendsByTicker,
    payingAssets: new Set(recentDividends.map(d => d.ticker)).size,
    recentDividends: recentDividends.slice(-10),
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT GENERATORS
// ═══════════════════════════════════════════════════════════════

export function generateExport(state: NexusState, format: ExportFormat): string {
  switch (format) {
    case 'gems-full':
      return generateGemsFullExport(state);
    case 'gems-quick':
      return generateGemsQuickExport(state);
    case 'gems-income':
      return generateGemsIncomeExport(state);
    case 'gems-rebalance':
      return generateGemsRebalanceExport(state);
    case 'json-raw':
      return generateJsonExport(state);
    default:
      return generateGemsFullExport(state);
  }
}

// ═══════════════════════════════════════════════════════════════
// GEMS FULL EXPORT
// ═══════════════════════════════════════════════════════════════

function generateGemsFullExport(state: NexusState): string {
  const stats = calculatePortfolioStats(state);
  const vixLevel = getVixLevel(state.market.vix || 15);
  const typeStats = groupAssets(state.assets, 'type', stats.totalValue);
  const sectorStats = groupAssets(state.assets, 'sector', stats.totalValue);
  const dividendStats = calculateDividendStats(state.dividends, state.assets);
  const totalRealizedPL = Object.values(state.tradeSums || {}).reduce((a, b) => a + b, 0);
  const recentTrend = (state.timeline || []).slice(-30);

  return `# NEXUS Portfolio Analysis Request
> Timestamp: ${new Date().toISOString()}
> Platform: NEXUS Dashboard V1.7

## 📊 Portfolio Context
- **Strategy**: ${state.strategy || 'Balanced'}
- **VIX Level**: ${state.market.vix?.toFixed(2) || 'N/A'} (${vixLevel.label}) → ${vixLevel.action}
- **Market State**: ${state.market.marketState || 'UNKNOWN'}

## 💰 Summary
| Metric | USD | KRW |
|--------|-----|-----|
| Total Value | $${stats.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})} | ₩${stats.totalValueKrw.toLocaleString()} |
| Total Cost | $${stats.totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})} | ₩${stats.totalCostKrw.toLocaleString()} |
| Unrealized P&L | $${(stats.totalValue - stats.totalCost).toLocaleString(undefined, {maximumFractionDigits: 0})} (${((stats.totalValue - stats.totalCost) / stats.totalCost * 100).toFixed(2)}%) | ₩${(stats.totalValueKrw - stats.totalCostKrw).toLocaleString()} |
| Realized P&L | $${totalRealizedPL.toLocaleString(undefined, {maximumFractionDigits: 0})} | - |
| Exchange Rate | - | ₩${state.exchangeRate.toLocaleString()} |

## 📈 Holdings (${state.assets.length} assets)
| Ticker | Type | Sector | Qty | Avg | Price | Value | Weight | Return |
|--------|------|--------|-----|-----|-------|-------|--------|--------|
${state.assets.map(a => {
  const value = a.qty * a.price;
  const weight = (value / stats.totalValue * 100).toFixed(1);
  const ret = a.avg > 0 ? ((a.price - a.avg) / a.avg * 100).toFixed(2) : '0.00';
  return `| ${a.ticker} | ${a.type} | ${a.sector} | ${a.qty} | $${a.avg.toFixed(2)} | $${a.price.toFixed(2)} | $${value.toFixed(0)} | ${weight}% | ${ret}% |`;
}).join('\n')}

## 🏷️ Allocation by Type
| Type | Weight | Return | Assets |
|------|--------|--------|--------|
${typeStats.map(t => `| ${t.name} | ${t.weight} | ${t.returnPct} | ${t.assetCount} |`).join('\n')}

## 🏢 Allocation by Sector
| Sector | Weight | Return | Assets |
|--------|--------|--------|--------|
${sectorStats.map(s => `| ${s.name} | ${s.weight} | ${s.returnPct} | ${s.assetCount} |`).join('\n')}

## 💵 Income Analysis
| Metric | Value |
|--------|-------|
| Annual Dividend (Gross) | $${dividendStats.totalAnnualDividend.toFixed(2)} |
| Annual Dividend (After Tax) | $${dividendStats.afterTaxDividend.toFixed(2)} |
| Yield on Cost | ${(dividendStats.totalAnnualDividend / stats.totalCost * 100).toFixed(2)}% |
| Paying Assets | ${dividendStats.payingAssets} |

### Monthly Dividend Trend
${Object.entries(dividendStats.monthlyDividends).slice(-6).map(([m, v]) => `- ${m}: $${v.toFixed(2)}`).join('\n') || '- No dividend data'}

## 📉 Market Data
| Index | Value |
|-------|-------|
| NASDAQ | ${state.market.nasdaq?.toLocaleString() || 'N/A'} |
| S&P 500 | ${state.market.sp500?.toLocaleString() || 'N/A'} |
| VIX | ${state.market.vix?.toFixed(2) || 'N/A'} |
| US 10Y | ${state.market.tnx?.toFixed(2) || 'N/A'}% |

## 🔄 Performance Trend (Recent)
${recentTrend.slice(-5).map(t => `- ${t.date}: $${t.value.toLocaleString()} (${t.cost > 0 ? ((t.value - t.cost) / t.cost * 100).toFixed(2) : 0}%)`).join('\n') || '- No trend data'}

---
**분석 요청**: Freedom V30 방법론으로 전체 포트폴리오 진단을 수행해주세요.
- 섹터/타입별 배분 적정성
- 리스크 요인 및 개선점
- 현재 시장 상황 고려한 조언
`;
}

// ═══════════════════════════════════════════════════════════════
// GEMS QUICK EXPORT
// ═══════════════════════════════════════════════════════════════

function generateGemsQuickExport(state: NexusState): string {
  const stats = calculatePortfolioStats(state);
  const vixLevel = getVixLevel(state.market.vix || 15);
  const typeStats = groupAssets(state.assets, 'type', stats.totalValue);
  const totalRealizedPL = Object.values(state.tradeSums || {}).reduce((a, b) => a + b, 0);
  
  // Top 5 holdings
  const topHoldings = [...state.assets]
    .sort((a, b) => (b.qty * b.price) - (a.qty * a.price))
    .slice(0, 5);

  return `# NEXUS Quick Summary
> ${new Date().toLocaleDateString('ko-KR')} | Strategy: ${state.strategy || 'Balanced'}

## 📊 핵심 지표
| 항목 | 값 |
|------|-----|
| 총 평가금 | $${stats.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})} (₩${stats.totalValueKrw.toLocaleString()}) |
| 수익률 | ${((stats.totalValue - stats.totalCost) / stats.totalCost * 100).toFixed(2)}% |
| 실현 손익 | $${totalRealizedPL.toLocaleString(undefined, {maximumFractionDigits: 0})} |
| VIX | ${state.market.vix?.toFixed(2)} (${vixLevel.label}) |

## 🏆 Top 5 Holdings
${topHoldings.map((a, i) => {
  const value = a.qty * a.price;
  const ret = a.avg > 0 ? ((a.price - a.avg) / a.avg * 100).toFixed(1) : '0';
  return `${i + 1}. **${a.ticker}** - $${value.toFixed(0)} (${ret}%)`;
}).join('\n')}

## 📦 Type 배분
${typeStats.map(t => `- ${t.name}: ${t.weight}`).join('\n')}

---
**요청**: 30초 안에 읽을 수 있는 핵심 요약을 해주세요.
1. 현재 상태 (1-2줄)
2. 가장 주의할 점 1가지
3. 오늘 할 수 있는 액션 1가지
`;
}

// ═══════════════════════════════════════════════════════════════
// GEMS INCOME EXPORT
// ═══════════════════════════════════════════════════════════════

function generateGemsIncomeExport(state: NexusState): string {
  const stats = calculatePortfolioStats(state);
  const dividendStats = calculateDividendStats(state.dividends, state.assets);
  
  // INCOME 타입 자산만
  const incomeAssets = state.assets.filter(a => a.type === 'INCOME');
  
  return `# NEXUS Income Analysis Request
> ${new Date().toLocaleDateString('ko-KR')} | Focus: Dividend & Income

## 💰 Income Portfolio Summary
| Metric | Value |
|--------|-------|
| Total Portfolio Value | $${stats.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})} |
| INCOME Assets Value | $${incomeAssets.reduce((s, a) => s + a.qty * a.price, 0).toLocaleString(undefined, {maximumFractionDigits: 0})} |
| Annual Dividend (Gross) | $${dividendStats.totalAnnualDividend.toFixed(2)} |
| Annual Dividend (After 15% Tax) | $${dividendStats.afterTaxDividend.toFixed(2)} |
| Yield on Cost | ${(dividendStats.totalAnnualDividend / stats.totalCost * 100).toFixed(2)}% |
| Monthly Average | $${(dividendStats.afterTaxDividend / 12).toFixed(2)} |

## 📈 INCOME Assets
| Ticker | Qty | Avg | Price | Value | Return | Annual Div |
|--------|-----|-----|-------|-------|--------|------------|
${incomeAssets.map(a => {
  const value = a.qty * a.price;
  const ret = a.avg > 0 ? ((a.price - a.avg) / a.avg * 100).toFixed(2) : '0';
  const annualDiv = dividendStats.dividendsByTicker[a.ticker] || 0;
  return `| ${a.ticker} | ${a.qty} | $${a.avg.toFixed(2)} | $${a.price.toFixed(2)} | $${value.toFixed(0)} | ${ret}% | $${annualDiv.toFixed(2)} |`;
}).join('\n')}

## 📅 Monthly Dividend Trend
| Month | Amount |
|-------|--------|
${Object.entries(dividendStats.monthlyDividends).slice(-12).map(([m, v]) => `| ${m} | $${v.toFixed(2)} |`).join('\n') || '| - | No data |'}

## 📋 Recent Dividend Records
${dividendStats.recentDividends.slice(-10).map(d => 
  `- ${d.date}: ${d.ticker} - ${d.qty} × $${d.dps.toFixed(4)} = $${(d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE).toFixed(2)} (after tax)`
).join('\n') || '- No recent dividends'}

---
**분석 요청**: 배당 포트폴리오 심층 분석
1. 각 배당주의 배당 안전성 평가
2. 월별 배당 흐름 균등화 제안
3. 배당 성장 전망
4. 목표 월 배당금 달성을 위한 로드맵
`;
}

// ═══════════════════════════════════════════════════════════════
// GEMS REBALANCE EXPORT
// ═══════════════════════════════════════════════════════════════

function generateGemsRebalanceExport(state: NexusState): string {
  const stats = calculatePortfolioStats(state);
  const vixLevel = getVixLevel(state.market.vix || 15);
  const typeStats = groupAssets(state.assets, 'type', stats.totalValue);
  const sectorStats = groupAssets(state.assets, 'sector', stats.totalValue);
  
  // 개별 종목 비중
  const assetWeights = state.assets.map(a => ({
    ticker: a.ticker,
    type: a.type,
    sector: a.sector,
    value: a.qty * a.price,
    weight: (a.qty * a.price / stats.totalValue * 100),
    returnPct: a.avg > 0 ? ((a.price - a.avg) / a.avg * 100) : 0,
  })).sort((a, b) => b.weight - a.weight);

  return `# NEXUS Rebalancing Analysis Request
> ${new Date().toLocaleDateString('ko-KR')} | Strategy: ${state.strategy || 'Balanced'}

## 📊 Current Portfolio State
| Metric | Value |
|--------|-------|
| Total Value | $${stats.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})} |
| Total Cost | $${stats.totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})} |
| Overall Return | ${((stats.totalValue - stats.totalCost) / stats.totalCost * 100).toFixed(2)}% |
| VIX Level | ${state.market.vix?.toFixed(2)} (${vixLevel.label}) |
| Asset Count | ${state.assets.length} |

## 🏷️ Current Type Allocation
| Type | Current Weight | Assets | Avg Return |
|------|----------------|--------|------------|
${typeStats.map(t => `| ${t.name} | ${t.weight} | ${t.assetCount} | ${t.returnPct} |`).join('\n')}

## 🏢 Current Sector Allocation
| Sector | Current Weight | Assets | Avg Return |
|--------|----------------|--------|------------|
${sectorStats.map(s => `| ${s.name} | ${s.weight} | ${s.assetCount} | ${s.returnPct} |`).join('\n')}

## 📈 Individual Asset Weights
| Ticker | Type | Sector | Weight | Return |
|--------|------|--------|--------|--------|
${assetWeights.map(a => `| ${a.ticker} | ${a.type} | ${a.sector} | ${a.weight.toFixed(1)}% | ${a.returnPct.toFixed(2)}% |`).join('\n')}

## ⚠️ Concentration Analysis
- **Top 1 Asset**: ${assetWeights[0]?.ticker} (${assetWeights[0]?.weight.toFixed(1)}%)
- **Top 3 Assets**: ${assetWeights.slice(0, 3).reduce((s, a) => s + a.weight, 0).toFixed(1)}%
- **Top 5 Assets**: ${assetWeights.slice(0, 5).reduce((s, a) => s + a.weight, 0).toFixed(1)}%

---
**분석 요청**: 포트폴리오 리밸런싱 계획 수립
1. 현재 배분의 문제점 진단
2. 전략(${state.strategy || 'Balanced'})에 맞는 목표 배분 제안
3. 구체적인 매수/매도 계획 (표 형식)
4. 리밸런싱 후 예상 효과
5. 단계별 실행 일정 (1주/1개월)
`;
}

// ═══════════════════════════════════════════════════════════════
// JSON RAW EXPORT
// ═══════════════════════════════════════════════════════════════

function generateJsonExport(state: NexusState): string {
  const stats = calculatePortfolioStats(state);
  const typeStats = groupAssets(state.assets, 'type', stats.totalValue);
  const sectorStats = groupAssets(state.assets, 'sector', stats.totalValue);
  const dividendStats = calculateDividendStats(state.dividends, state.assets);
  const totalRealizedPL = Object.values(state.tradeSums || {}).reduce((a, b) => a + b, 0);
  const recentTrend = (state.timeline || []).slice(-30);

  const data = {
    meta: {
      timestamp: new Date().toISOString(),
      platform: "NEXUS Dashboard V1.7",
      strategy: state.strategy || 'Unspecified',
    },
    summary: {
      totalValue: Number(stats.totalValue.toFixed(2)),
      totalCost: Number(stats.totalCost.toFixed(2)),
      totalValueKrw: stats.totalValueKrw,
      totalCostKrw: stats.totalCostKrw,
      unrealizedPnL: Number((stats.totalValue - stats.totalCost).toFixed(2)),
      unrealizedReturnPct: stats.totalCost > 0 ? Number(((stats.totalValue - stats.totalCost) / stats.totalCost * 100).toFixed(2)) : 0,
      realizedPnL: Number(totalRealizedPL.toFixed(2)),
      exchangeRate: state.exchangeRate,
    },
    groups: {
      byType: typeStats,
      bySector: sectorStats,
    },
    income: {
      annualDividendGross: Number(dividendStats.totalAnnualDividend.toFixed(2)),
      annualDividendAfterTax: Number(dividendStats.afterTaxDividend.toFixed(2)),
      yieldOnCost: Number((dividendStats.totalAnnualDividend / stats.totalCost * 100).toFixed(2)),
      payingAssets: dividendStats.payingAssets,
      monthlyTrend: dividendStats.monthlyDividends,
    },
    assets: state.assets.map(a => ({
      ticker: a.ticker,
      type: a.type,
      sector: a.sector,
      qty: a.qty,
      avg: a.avg,
      price: a.price,
      buyRate: a.buyRate,
      value: Number((a.qty * a.price).toFixed(2)),
      weight: Number((a.qty * a.price / stats.totalValue * 100).toFixed(2)),
      returnPct: a.avg > 0 ? Number(((a.price - a.avg) / a.avg * 100).toFixed(2)) : 0,
    })),
    market: {
      nasdaq: state.market.nasdaq,
      sp500: state.market.sp500,
      vix: state.market.vix,
      tnx: state.market.tnx,
      marketState: state.market.marketState,
    },
    history: {
      recentTrend: recentTrend.map(t => ({
        date: t.date,
        value: Math.round(t.value),
        returnPct: t.cost > 0 ? Number(((t.value - t.cost) / t.cost * 100).toFixed(2)) : 0,
      })),
    },
    tradeSums: state.tradeSums,
  };

  return JSON.stringify(data, null, 2);
}
