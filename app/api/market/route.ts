// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Market Indices API Route (24H Real-time)
// NASDAQ, S&P 500, VIX, US10Y, USD/KRW
// 정규장 + 프리마켓 + 애프터마켓 + 선물 지원
// KST 기반 정확한 시장 상태 계산
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';
import { getMarketState } from '@/lib/utils';

// 현물 + 선물 티커 (장외 시간에는 선물 사용)
const INDICES = [
  { key: 'nasdaq', spot: '^IXIC', futures: 'NQ=F' },
  { key: 'sp500', spot: '^GSPC', futures: 'ES=F' },
  { key: 'vix', spot: '^VIX', futures: 'VX=F' },
  { key: 'tnx', spot: '^TNX', futures: null }, // 금리는 선물 없음
  { key: 'krw', spot: 'KRW=X', futures: null }, // 환율은 24시간 거래
];

interface FetchResult {
  price: number | null;
  marketState: string;
  source: 'spot' | 'futures' | 'pre' | 'post';
}

async function fetchPrice(ticker: string): Promise<FetchResult> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1m&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store', // 캐시 비활성화 (실시간)
    });

    if (!response.ok) return { price: null, marketState: 'CLOSED', source: 'spot' };

    const data = await response.json();
    const meta = data.chart?.result?.[0]?.meta;
    
    if (!meta) return { price: null, marketState: 'CLOSED', source: 'spot' };

    const marketState = meta.marketState || 'REGULAR';
    let price = meta.regularMarketPrice;
    let source: 'spot' | 'futures' | 'pre' | 'post' = 'spot';

    // 프리마켓 가격
    if (marketState === 'PRE' && meta.preMarketPrice) {
      price = meta.preMarketPrice;
      source = 'pre';
    } 
    // 애프터마켓 가격
    else if (marketState === 'POST' && meta.postMarketPrice) {
      price = meta.postMarketPrice;
      source = 'post';
    }

    return { price, marketState, source };
  } catch {
    return { price: null, marketState: 'ERROR', source: 'spot' };
  }
}

async function fetchIndexData(idx: { key: string; spot: string; futures: string | null }) {
  // 1차: 현물 시세 조회
  const spotResult = await fetchPrice(idx.spot);
  
  // 정규장/프리마켓/애프터마켓이면 현물 사용
  if (spotResult.price && ['REGULAR', 'PRE', 'POST'].includes(spotResult.marketState)) {
    return {
      key: idx.key,
      value: spotResult.price,
      marketState: spotResult.marketState,
      source: spotResult.source,
    };
  }

  // 2차: 장외 시간에 선물 데이터 조회
  if (idx.futures) {
    const futuresResult = await fetchPrice(idx.futures);
    if (futuresResult.price) {
      return {
        key: idx.key,
        value: futuresResult.price,
        marketState: spotResult.marketState,
        source: 'futures' as const,
      };
    }
  }

  // 3차: fallback - 마지막 현물 가격
  return {
    key: idx.key,
    value: spotResult.price || 0,
    marketState: spotResult.marketState,
    source: spotResult.source,
  };
}

export async function GET() {
  try {
    const results = await Promise.all(
      INDICES.map(idx => fetchIndexData(idx))
    );

    const market: Record<string, number> = {};
    const sources: Record<string, string> = {};

    results.forEach(({ key, value, source }) => {
      market[key] = value || 0;
      sources[key] = source;
    });

    // KST 기준으로 정확한 시장 상태 계산
    const currentMarketState = getMarketState();

    return NextResponse.json({
      ...market,
      marketState: currentMarketState,
      sources, // 디버깅용: 각 지수의 데이터 소스
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
