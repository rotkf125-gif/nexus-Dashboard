// ═══════════════════════════════════════════════════════════════
// NEXUS V65.1 - Benchmark YTD Returns API
// 1년 차트 데이터 기반 YTD 수익률 계산
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

const BENCHMARKS = [
  { ticker: 'SPY', name: 'S&P 500', color: '#81C784' },
  { ticker: 'QQQ', name: 'NASDAQ', color: '#64B5F6' },
  { ticker: 'DIA', name: 'Dow Jones', color: '#FFB74D' },
  { ticker: 'IWM', name: 'Russell 2000', color: '#BA68C8' },
];

interface BenchmarkResult {
  ticker: string;
  name: string;
  color: string;
  ytdReturn: number;
  currentPrice: number;
  yearStartPrice: number;
}

async function fetchYTDReturn(ticker: string): Promise<{ ytdReturn: number; currentPrice: number; yearStartPrice: number } | null> {
  try {
    // 1년 차트 데이터 가져오기 (일봉)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const currentPrice = result.meta?.regularMarketPrice || closes[closes.length - 1];

    // 올해 1월 1일 이후 첫 거래일 찾기
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1).getTime() / 1000;
    
    let yearStartPrice = null;
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= yearStart && closes[i]) {
        yearStartPrice = closes[i];
        break;
      }
    }

    // 연초 데이터가 없으면 가장 오래된 데이터 사용
    if (!yearStartPrice) {
      for (let i = 0; i < closes.length; i++) {
        if (closes[i]) {
          yearStartPrice = closes[i];
          break;
        }
      }
    }

    if (!yearStartPrice || !currentPrice) return null;

    const ytdReturn = ((currentPrice - yearStartPrice) / yearStartPrice) * 100;

    return { ytdReturn, currentPrice, yearStartPrice };
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const results: BenchmarkResult[] = [];

    await Promise.all(
      BENCHMARKS.map(async (benchmark) => {
        const data = await fetchYTDReturn(benchmark.ticker);
        if (data) {
          results.push({
            ...benchmark,
            ytdReturn: data.ytdReturn,
            currentPrice: data.currentPrice,
            yearStartPrice: data.yearStartPrice,
          });
        } else {
          // API 실패 시 기본값
          results.push({
            ...benchmark,
            ytdReturn: 0,
            currentPrice: 0,
            yearStartPrice: 0,
          });
        }
      })
    );

    // 원래 순서 유지
    const orderedResults = BENCHMARKS.map(b => 
      results.find(r => r.ticker === b.ticker) || { ...b, ytdReturn: 0, currentPrice: 0, yearStartPrice: 0 }
    );

    return NextResponse.json({
      benchmarks: orderedResults,
      timestamp: Date.now(),
      year: new Date().getFullYear(),
    });
  } catch (error) {
    console.error('Error fetching benchmark data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch benchmark data' },
      { status: 500 }
    );
  }
}
