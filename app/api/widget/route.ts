import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WidgetData, Asset } from '@/lib/types';

// Supabase 클라이언트 생성 (서버사이드)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 시장 상태 계산 (간단한 버전)
function getMarketState(): string {
  const now = new Date();
  const kstHours = (now.getUTCHours() + 9) % 24;
  const dayOfWeek = now.getUTCDay();

  // 주말 체크
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'CLOSED';
  }

  // 미국 시장 시간 (KST 기준)
  // 프리마켓: 18:00 - 22:30 KST
  // 정규장: 22:30 - 05:00 KST (다음날)
  // 애프터: 05:00 - 07:00 KST

  if (kstHours >= 18 && kstHours < 22) {
    return 'PRE';
  } else if (kstHours >= 22 || kstHours < 5) {
    return 'REGULAR';
  } else if (kstHours >= 5 && kstHours < 7) {
    return 'POST';
  }

  return 'CLOSED';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    // 인증 검사
    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid parameter. Use ?uid=your_user_id' },
        {
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
          }
        }
      );
    }

    // Supabase에서 포트폴리오 데이터 조회
    const { data, error } = await supabase
      .from('portfolios')
      .select('assets, market, exchange_rate')
      .eq('user_id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Portfolio not found for this user ID' },
          {
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
      }
      throw error;
    }

    const assets: Asset[] = data?.assets || [];
    const exchangeRate = data?.exchange_rate || 1450;

    // 포트폴리오 계산
    let totalValue = 0;
    let totalCost = 0;

    const holdings = assets.map((a: Asset) => {
      const value = a.qty * a.price;
      const cost = a.qty * a.avg;
      totalValue += value;
      totalCost += cost;

      return {
        ticker: a.ticker,
        value: Math.round(value * 100) / 100,
        returnPct: cost > 0 ? Math.round(((value - cost) / cost) * 10000) / 100 : 0,
      };
    });

    // 상위 3개 종목 (가치 순)
    const topHoldings = holdings
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);

    const todayReturn = totalValue - totalCost;
    const todayReturnPct = totalCost > 0
      ? Math.round(((totalValue - totalCost) / totalCost) * 10000) / 100
      : 0;

    const widgetData: WidgetData = {
      timestamp: Date.now(),
      totalValue: Math.round(totalValue * 100) / 100,
      totalValueKRW: Math.round(totalValue * exchangeRate),
      todayReturn: Math.round(todayReturn * 100) / 100,
      todayReturnPct,
      topHoldings,
      marketState: getMarketState(),
      exchangeRate,
    };

    return NextResponse.json(widgetData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Widget API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
