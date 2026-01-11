// ═══════════════════════════════════════════════════════════════
// NEXUS V65.7 - Stock Info API Route
// Yahoo Finance quoteSummary를 통해 섹터/산업 정보 조회
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

// Yahoo Finance 섹터명 → 내부 표준 섹터명 매핑
const SECTOR_MAP: Record<string, string> = {
  'Technology': 'Technology',
  'Financial Services': 'Finance',
  'Healthcare': 'Healthcare',
  'Consumer Cyclical': 'Consumer',
  'Consumer Defensive': 'Consumer',
  'Communication Services': 'Communication',
  'Industrials': 'Industrial',
  'Energy': 'Energy',
  'Basic Materials': 'Materials',
  'Real Estate': 'RealEstate',
  'Utilities': 'Utilities',
};

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker required' }, { status: 400 });
  }

  try {
    // quoteSummary API - summaryProfile과 assetProfile 모듈 요청
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=summaryProfile,assetProfile,quoteType`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 86400 }, // 24시간 캐시 (섹터는 자주 변하지 않음)
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance responded with ${response.status}`);
    }

    const data = await response.json();
    const result = data.quoteSummary?.result?.[0];

    if (!result) {
      throw new Error('No data found');
    }

    // 주식: summaryProfile / assetProfile에서 섹터 추출
    const profile = result.summaryProfile || result.assetProfile || {};
    const quoteType = result.quoteType || {};

    // 섹터 추출 (없으면 'Other')
    const rawSector = profile.sector || '';
    const sector = SECTOR_MAP[rawSector] || rawSector || 'Other';

    // 산업 추출
    const industry = profile.industry || '';

    // 종목 타입 (EQUITY, ETF, MUTUALFUND 등)
    const quoteTypeStr = quoteType.quoteType || 'EQUITY';

    // ETF인 경우 별도 표시
    const isETF = quoteTypeStr === 'ETF';

    // 회사명/펀드명
    const name = quoteType.shortName || quoteType.longName || ticker;

    return NextResponse.json({
      ticker,
      sector,
      industry,
      name,
      quoteType: quoteTypeStr,
      isETF,
      rawSector, // 원본 섹터명 (디버깅용)
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`Error fetching info for ${ticker}:`, error);

    // 에러 시에도 기본값 반환 (클라이언트에서 처리 가능하도록)
    return NextResponse.json({
      ticker,
      sector: 'Other',
      industry: '',
      name: ticker,
      quoteType: 'UNKNOWN',
      isETF: false,
      error: `Failed to fetch info for ${ticker}`,
      timestamp: Date.now(),
    });
  }
}
