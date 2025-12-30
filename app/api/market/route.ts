// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - Market Indices API Route
// NASDAQ, S&P 500, VIX, US10Y, USD/KRW 한번에 조회
// 프리마켓/애프터마켓 지원
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

const INDICES = [
  { key: 'nasdaq', ticker: '^IXIC' },
  { key: 'sp500', ticker: '^GSPC' },
  { key: 'vix', ticker: '^VIX' },
  { key: 'tnx', ticker: '^TNX' },
  { key: 'krw', ticker: 'KRW=X' },
];

async function fetchPrice(ticker: string): Promise<{ price: number | null; marketState: string }> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) return { price: null, marketState: 'CLOSED' };

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;
    
    if (!meta) return { price: null, marketState: 'CLOSED' };

    // 시장 상태에 따른 가격 선택
    const marketState = meta.marketState || 'REGULAR';
    let price = meta.regularMarketPrice;

    // 프리마켓/애프터마켓 가격이 있으면 사용
    if (marketState === 'PRE' && meta.preMarketPrice) {
      price = meta.preMarketPrice;
    } else if (marketState === 'POST' && meta.postMarketPrice) {
      price = meta.postMarketPrice;
    } else if (marketState === 'PREPRE' || marketState === 'POSTPOST') {
      // 프리프리/포스트포스트 상태에서는 마지막 종가 사용
      price = meta.previousClose || meta.regularMarketPrice;
    }

    return { price, marketState };
  } catch {
    return { price: null, marketState: 'ERROR' };
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      INDICES.map(async (idx) => {
        const { price, marketState } = await fetchPrice(idx.ticker);
        return { key: idx.key, value: price, marketState };
      })
    );

    const market: Record<string, number> = {};
    let currentMarketState = 'CLOSED';
    
    results.forEach(({ key, value, marketState }) => {
      market[key] = value || 0;
      if (key === 'nasdaq') currentMarketState = marketState;
    });

    return NextResponse.json({
      ...market,
      marketState: currentMarketState,
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
