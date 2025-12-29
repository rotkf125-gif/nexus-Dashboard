// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - Market Indices API Route
// NASDAQ, S&P 500, VIX, US10Y, USD/KRW 한번에 조회
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

const INDICES = [
  { key: 'nasdaq', ticker: '^IXIC' },
  { key: 'sp500', ticker: '^GSPC' },
  { key: 'vix', ticker: '^VIX' },
  { key: 'tnx', ticker: '^TNX' },
  { key: 'krw', ticker: 'KRW=X' },
];

async function fetchPrice(ticker: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      INDICES.map(async (idx) => ({
        key: idx.key,
        value: await fetchPrice(idx.ticker),
      }))
    );

    const market: Record<string, number> = {};
    results.forEach(({ key, value }) => {
      market[key] = value || 0;
    });

    return NextResponse.json({
      ...market,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
