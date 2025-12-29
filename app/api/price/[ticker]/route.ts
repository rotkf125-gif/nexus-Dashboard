// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - Stock Price API Route
// 서버에서 Yahoo Finance 호출 → CORS 문제 없음!
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 }, // 60초 캐시
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]?.meta?.regularMarketPrice) {
      throw new Error('Invalid data format');
    }

    const price = data.chart.result[0].meta.regularMarketPrice;
    const previousClose = data.chart.result[0].meta.previousClose || price;
    const change = price - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return NextResponse.json({
      ticker,
      price,
      previousClose,
      change,
      changePercent,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch ${ticker}`, ticker },
      { status: 500 }
    );
  }
}
