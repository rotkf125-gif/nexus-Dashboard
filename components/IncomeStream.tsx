'use client';

import { useMemo, useState } from 'react';
import { useNexus } from '@/lib/context';

export default function IncomeStream() {
  const { state, setTradeSums, syncFromSheet, toast } = useNexus();
  const { assets, dividends, tradeSums } = state;

  // INCOME 타입 자산만 필터링
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 손실금액 수동 입력 상태
  const [editingLoss, setEditingLoss] = useState<string | null>(null);
  const [lossInput, setLossInput] = useState('');

  // 각 INCOME 자산별 배당 통계 계산
  const incomeStats = useMemo(() => {
    return incomeAssets.map(asset => {
      const tickerDividends = dividends.filter(d => d.ticker === asset.ticker);
      
      // 총 배당금 (세후 15%)
      const totalDividend = tickerDividends.reduce((sum, d) => {
        const gross = d.qty * d.dps;
        return sum + gross * 0.85;
      }, 0);

      // 배당 횟수
      const dividendCount = tickerDividends.length;

      // 평균 DPS
      const avgDps = dividendCount > 0
        ? tickerDividends.reduce((sum, d) => sum + d.dps, 0) / dividendCount
        : 0;

      // 손실금액 (tradeSums에서 가져오거나 자산 손익으로 계산)
      const currentValue = asset.qty * asset.price;
      const costBasis = asset.qty * asset.avg;
      const unrealizedLoss = Math.max(0, costBasis - currentValue);
      const lossAmount = tradeSums[asset.ticker] || unrealizedLoss;

      // Recovery 진행률
      const recoveryPct = lossAmount > 0 ? Math.min(100, (totalDividend / lossAmount) * 100) : 0;

      return {
        ticker: asset.ticker,
        qty: asset.qty,
        totalDividend,
        dividendCount,
        avgDps,
        lossAmount,
        recoveryPct,
      };
    });
  }, [incomeAssets, dividends, tradeSums]);

  // Weekly Summary 계산 (2025-10-23 이후)
  const weeklySummary = useMemo(() => {
    const startDate = new Date('2025-10-23');
    const now = new Date();
    const weeksSinceStart = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

    // 2025-10-23 이후 배당만 필터
    const recentDividends = dividends.filter(d => new Date(d.date) >= startDate);

    // 주간별 배당 합계
    const weeklyTotals: number[] = [];
    recentDividends.forEach(d => {
      const weekIndex = Math.floor((new Date(d.date).getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (!weeklyTotals[weekIndex]) weeklyTotals[weekIndex] = 0;
      weeklyTotals[weekIndex] += d.qty * d.dps * 0.85;
    });

    const totalAfterTax = recentDividends.reduce((sum, d) => sum + d.qty * d.dps * 0.85, 0);
    const weeklyAvg = weeksSinceStart > 0 ? totalAfterTax / weeksSinceStart : 0;
    const validWeeks = weeklyTotals.filter(w => w > 0);
    const weeklyMin = validWeeks.length > 0 ? Math.min(...validWeeks) : 0;
    const weeklyMax = validWeeks.length > 0 ? Math.max(...validWeeks) : 0;

    return { weeklyAvg, weeklyMin, weeklyMax };
  }, [dividends]);

  // 최근 배당 로그 (최근 5개)
  const recentLogs = useMemo(() => {
    return [...dividends]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [dividends]);

  const handleSaveLoss = (ticker: string) => {
    const amount = parseFloat(lossInput);
    if (!isNaN(amount) && amount >= 0) {
      setTradeSums(ticker, amount);
      toast(`${ticker} 손실금액 설정: $${amount.toFixed(2)}`, 'success');
    }
    setEditingLoss(null);
    setLossInput('');
  };

  if (incomeAssets.length === 0) {
    return (
      <div className="text-center py-8 opacity-50">
        <i className="fas fa-coins text-3xl mb-3 opacity-30" />
        <div className="text-sm">INCOME 타입 자산이 없습니다</div>
      </div>
    );
  }

  // 그리드 컬럼 결정
  const gridCols = incomeAssets.length === 1 ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2';

  return (
    <div className="space-y-3">
      {/* Income Cards */}
      <div className={`grid ${gridCols} gap-3`}>
        {incomeStats.map((stat, i) => {
          const isGold = i % 2 === 1;
          const borderClass = isGold ? 'border-celestial-gold/20' : 'border-white/5';
          const textClass = isGold ? 'text-celestial-gold' : 'text-white/80';
          const barBg = isGold ? 'bg-celestial-gold/10' : 'bg-white/5';
          const barFill = isGold 
            ? 'bg-gradient-to-r from-celestial-gold/50 to-celestial-gold' 
            : 'bg-gradient-to-r from-white/30 to-white/60';

          return (
            <div 
              key={stat.ticker} 
              className={`inner-glass p-4 rounded border ${borderClass} relative overflow-hidden`}
            >
              {/* Background ticker */}
              <div className={`absolute top-0 right-0 p-2 text-[20px] font-display font-light ${isGold ? 'text-celestial-gold/10' : 'text-white/5'}`}>
                {stat.ticker}
              </div>

              {/* Header */}
              <div className="flex justify-between items-center mb-3 relative z-10">
                <span className={`text-base font-light font-display tracking-widest ${textClass}`}>
                  {stat.ticker}
                </span>
                <span className={`text-[10px] font-light px-2 py-0.5 border rounded ${isGold ? 'bg-celestial-gold/10 border-celestial-gold/30' : 'bg-white/5 border-white/10'}`}>
                  ${stat.totalDividend.toFixed(2)}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-light mb-3 opacity-80">
                <div className="flex justify-between">
                  <span className="opacity-60">배당 횟수</span>
                  <span>{stat.dividendCount}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">평균 DPS</span>
                  <span>${stat.avgDps.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">보유</span>
                  <span>{stat.qty}주</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-60">손실금액</span>
                  {editingLoss === stat.ticker ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={lossInput}
                        onChange={(e) => setLossInput(e.target.value)}
                        className="w-16 bg-black/30 border border-white/20 rounded px-1 text-[9px] text-right"
                        placeholder="0"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveLoss(stat.ticker)}
                        className="text-v64-success"
                      >
                        <i className="fas fa-check" />
                      </button>
                      <button 
                        onClick={() => { setEditingLoss(null); setLossInput(''); }}
                        className="text-v64-danger"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ) : (
                    <span 
                      className="cursor-pointer hover:text-celestial-gold"
                      onClick={() => {
                        setEditingLoss(stat.ticker);
                        setLossInput(stat.lossAmount.toString());
                      }}
                      title="클릭하여 수정"
                    >
                      ${stat.lossAmount.toFixed(2)} <i className="fas fa-pen text-[7px] opacity-50" />
                    </span>
                  )}
                </div>
              </div>

              {/* Recovery Progress */}
              <div className={`border-t pt-2 ${isGold ? 'border-celestial-gold/20' : 'border-white/10'}`}>
                <div className={`flex justify-between mb-1 text-[9px] tracking-widest font-light ${isGold ? 'text-celestial-gold/50' : 'opacity-50'}`}>
                  <span>RECOVERY</span>
                  <span>{stat.recoveryPct.toFixed(1)}%</span>
                </div>
                <div className={`w-full h-1 rounded-full overflow-hidden ${barBg}`}>
                  <div 
                    className={`h-full transition-all ${barFill}`}
                    style={{ width: `${Math.min(100, stat.recoveryPct)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Est. Weekly */}
        <div className="inner-glass p-3 text-center rounded border border-celestial-purple/20">
          <div className="text-[9px] text-celestial-purple tracking-[0.2em] mb-0.5 font-light">
            EST. WEEKLY
          </div>
          <div className="text-[7px] opacity-40 mb-1">(since 2025-10-23)</div>
          <div className="text-lg font-display font-light text-white">
            ${weeklySummary.weeklyAvg.toFixed(2)}
          </div>
          <div className="flex justify-between mt-1 text-[9px] font-light opacity-60">
            <span>MIN: <span className="text-white">${weeklySummary.weeklyMin.toFixed(2)}</span></span>
            <span>MAX: <span className="text-white">${weeklySummary.weeklyMax.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="inner-glass p-3 rounded flex flex-col">
          <div className="flex justify-between items-center mb-1 text-[9px] opacity-60 tracking-widest font-light">
            <span>RECENT LOGS</span>
            <i className="fas fa-history text-[8px]" />
          </div>
          <div className="overflow-y-auto custom-scrollbar flex-grow max-h-[80px] space-y-1">
            {recentLogs.length > 0 ? recentLogs.map((d, i) => (
              <div key={i} className="flex justify-between text-[9px] font-light">
                <span className="opacity-50">{d.date.slice(5)}</span>
                <span className={d.ticker === incomeStats[0]?.ticker ? 'text-white/80' : 'text-celestial-gold'}>
                  {d.ticker}
                </span>
                <span>${(d.qty * d.dps * 0.85).toFixed(2)}</span>
              </div>
            )) : (
              <div className="text-[9px] opacity-40 text-center py-2">기록 없음</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
