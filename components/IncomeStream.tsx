'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { CHART_COLORS } from '@/lib/config';

interface IncomeAssetCardProps {
  ticker: string;
  qty: number;
  avg: number;
  price: number;
  color: string;
  colorIndex: number;
}

function IncomeAssetCard({ ticker, qty, avg, price, color, colorIndex }: IncomeAssetCardProps) {
  const { state } = useNexus();
  
  // 이 티커의 배당 기록 필터링
  const tickerDividends = useMemo(() => 
    state.dividends
      .filter(d => d.ticker === ticker)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.dividends, ticker]
  );

  // 총 배당금 (세후)
  const totalDividend = useMemo(() => {
    return tickerDividends.reduce((sum, d) => sum + (d.qty * d.dps * 0.85), 0);
  }, [tickerDividends]);

  // 손실금액
  const cost = qty * avg;
  const value = qty * price;
  const loss = cost - value;

  // 회복률 계산
  const recoveryRate = useMemo(() => {
    if (loss <= 0) return 100; // 이익 상태면 100%
    if (totalDividend <= 0) return 0;
    return Math.min(100, (totalDividend / loss) * 100);
  }, [loss, totalDividend]);

  // 최근 5개 배당 기록
  const recentDividends = tickerDividends.slice(0, 5);

  // 평균 DPS
  const avgDps = useMemo(() => {
    if (tickerDividends.length === 0) return 0;
    const totalDps = tickerDividends.reduce((sum, d) => sum + d.dps, 0);
    return totalDps / tickerDividends.length;
  }, [tickerDividends]);

  const isGold = colorIndex % 2 === 1; // 짝수 인덱스는 흰색, 홀수는 골드

  return (
    <div 
      className={`inner-glass p-4 rounded border relative overflow-hidden ${
        isGold ? 'border-celestial-gold/20' : 'border-white/5'
      }`}
    >
      {/* Background Ticker */}
      <div 
        className={`absolute top-0 right-0 p-2 text-[20px] font-display font-light ${
          isGold ? 'text-celestial-gold/10' : 'text-white/5'
        }`}
      >
        {ticker}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-3 relative z-10">
        <span 
          className={`text-base font-light font-display tracking-widest ${
            isGold ? 'text-celestial-gold' : 'text-white/80'
          }`}
        >
          {ticker}
        </span>
        <span 
          className={`text-[10px] font-light px-2 py-0.5 border rounded ${
            isGold 
              ? 'bg-celestial-gold/10 border-celestial-gold/30' 
              : 'bg-white/5 border-white/10'
          }`}
        >
          ${totalDividend.toFixed(2)}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-light mb-3 opacity-80">
        <div className="flex justify-between">
          <span className="opacity-60">배당횟수</span>
          <span>{tickerDividends.length}회</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">평균 DPS</span>
          <span>${avgDps.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">보유수량</span>
          <span>{qty}주</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-60">손실금액</span>
          <span className={loss > 0 ? 'text-v64-danger' : 'text-v64-success'}>
            {loss > 0 ? `-$${loss.toFixed(2)}` : `+$${Math.abs(loss).toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Recovery Progress */}
      <div className={`border-t pt-2 ${isGold ? 'border-celestial-gold/20' : 'border-white/10'}`}>
        <div className={`flex justify-between mb-1 text-[9px] tracking-widest font-light ${
          isGold ? 'text-celestial-gold/50' : 'opacity-50'
        }`}>
          <span>RECOVERY</span>
          <span>{recoveryRate.toFixed(1)}%</span>
        </div>
        <div className={`w-full h-1 rounded-full overflow-hidden ${
          isGold ? 'bg-celestial-gold/10' : 'bg-white/5'
        }`}>
          <div 
            className={`h-full transition-all ${
              isGold 
                ? 'bg-gradient-to-r from-celestial-gold/50 to-celestial-gold' 
                : 'bg-gradient-to-r from-white/30 to-white/60'
            }`}
            style={{ width: `${recoveryRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function IncomeStream() {
  const { state } = useNexus();
  
  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => 
    state.assets.filter(a => a.type === 'INCOME'),
    [state.assets]
  );

  // 전체 배당 통계
  const stats = useMemo(() => {
    const allDividends = state.dividends;
    if (allDividends.length === 0) {
      return { total: 0, weeklyAvg: 0, min: 0, max: 0, count: 0 };
    }

    // 총 배당금 (세후)
    const total = allDividends.reduce((sum, d) => sum + (d.qty * d.dps * 0.85), 0);

    // 주간 배당 계산
    const weeklyTotals: { [week: string]: number } = {};
    allDividends.forEach(d => {
      const date = new Date(d.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + (d.qty * d.dps * 0.85);
    });

    const weeklyValues = Object.values(weeklyTotals);
    const weeklyAvg = weeklyValues.length > 0 
      ? weeklyValues.reduce((a, b) => a + b, 0) / weeklyValues.length 
      : 0;
    const min = weeklyValues.length > 0 ? Math.min(...weeklyValues) : 0;
    const max = weeklyValues.length > 0 ? Math.max(...weeklyValues) : 0;

    return { total, weeklyAvg, min, max, count: allDividends.length };
  }, [state.dividends]);

  // 최근 배당 기록
  const recentDividends = useMemo(() => 
    [...state.dividends]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [state.dividends]
  );

  return (
    <div className="space-y-3">
      {/* Income Asset Cards - 동적 생성 */}
      {incomeAssets.length > 0 ? (
        <div className={`grid gap-3 ${
          incomeAssets.length === 1 ? 'grid-cols-1' : 
          incomeAssets.length === 2 ? 'grid-cols-2' :
          incomeAssets.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 lg:grid-cols-3'
        }`}>
          {incomeAssets.map((asset, index) => (
            <IncomeAssetCard
              key={asset.ticker}
              ticker={asset.ticker}
              qty={asset.qty}
              avg={asset.avg}
              price={asset.price}
              color={CHART_COLORS[index % CHART_COLORS.length]}
              colorIndex={index}
            />
          ))}
        </div>
      ) : (
        <div className="inner-glass p-6 text-center rounded">
          <i className="fas fa-coins text-2xl text-celestial-gold/30 mb-2" />
          <div className="text-[11px] opacity-50">
            INCOME 타입 자산이 없습니다<br />
            자산 추가 시 Type을 INCOME으로 설정하세요
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="inner-glass p-3 text-center rounded border border-celestial-purple/20">
          <div className="text-[9px] text-celestial-purple tracking-[0.2em] mb-0.5 font-light">
            EST. WEEKLY
          </div>
          <div className="text-lg font-display font-light text-white">
            ${stats.weeklyAvg.toFixed(2)}
          </div>
          <div className="flex justify-between mt-1 text-[9px] font-light opacity-60">
            <span>MIN: <span className="text-white">${stats.min.toFixed(2)}</span></span>
            <span>MAX: <span className="text-white">${stats.max.toFixed(2)}</span></span>
          </div>
        </div>

        <div className="inner-glass p-3 rounded flex flex-col">
          <div className="flex justify-between items-center mb-1 text-[9px] opacity-60 tracking-widest font-light">
            <span>RECENT LOGS</span>
            <i className="fas fa-history text-[8px]" />
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-grow max-h-[80px]">
            {recentDividends.length > 0 ? (
              recentDividends.map((d, i) => (
                <div key={i} className="flex justify-between text-[9px] py-0.5 border-b border-white/5 last:border-0">
                  <span className="opacity-60">{d.date}</span>
                  <span>{d.ticker}</span>
                  <span className="text-celestial-gold">${(d.qty * d.dps * 0.85).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-[9px] opacity-40 text-center py-2">기록 없음</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
