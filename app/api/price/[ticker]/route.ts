// ═══════════════════════════════════════════════════════════════
// NEXUS V64.2 - Stock Price API Route
// 서버에서 Yahoo Finance 호출 → CORS 문제 없음!
// 프리마켓/애프터마켓 지원
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, APIError } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 30 }, // 30초 캐시
    });

    if (!response.ok) {
      throw new APIError(response.status, `Yahoo Finance responded with ${response.status}`, 'VENDOR_ERROR');
    }

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;

    if (!meta) {
      throw new APIError(502, 'Invalid data format from Yahoo Finance', 'INVALID_DATA');
    }

    // 시장 상태 확인
    const marketState = meta.marketState || 'REGULAR';
    let price = meta.regularMarketPrice;
    const previousClose = meta.previousClose || price;

    // 프리마켓/애프터마켓 가격 사용
    if (marketState === 'PRE' && meta.preMarketPrice) {
      price = meta.preMarketPrice;
    } else if (marketState === 'POST' && meta.postMarketPrice) {
      price = meta.postMarketPrice;
    }

    const change = price - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return NextResponse.json({
      ticker,
      price,
      previousClose,
      change,
      changePercent,
      marketState,
      timestamp: Date.now(),
    });
  } catch (error) {
    // Standardized Error Handling
    return createErrorResponse(error);
  }
}
