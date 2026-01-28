'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';

export default function Learning() {
  const { state } = useNexus();
  const { assets, dividends } = state;

  // INCOME 자산만 필터
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 각 자산별 통계 계산
  const learningStats = useMemo(() => {
    return incomeAssets.slice(0, 2).map(asset => {
      const tickerDividends = dividends
        .filter(d => d.ticker === asset.ticker)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (tickerDividends.length < 2) {
        return {
          ticker: asset.ticker,
          accuracy: 0,
          ciLow: 0,
          ciHigh: 0,
          dataPoints: tickerDividends.length,
          period: 0,
          mae: 0,
          trend: '--',
        };
      }

      const dpsValues = tickerDividends.map(d => d.dps);
      const mean = dpsValues.reduce((a, b) => a + b, 0) / dpsValues.length;
      
      // 표준편차 계산
      const variance = dpsValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dpsValues.length;
      const stdDev = Math.sqrt(variance);

      // 95% 신뢰구간 (mean ± 1.96 * stdDev / sqrt(n))
      const marginOfError = 1.96 * stdDev / Math.sqrt(dpsValues.length);
      const ciLow = Math.max(0, mean - marginOfError);
      const ciHigh = mean + marginOfError;

      // 정확도: 실제 DPS가 신뢰구간 내에 있는 비율
      const withinCI = dpsValues.filter(v => v >= ciLow && v <= ciHigh).length;
      const accuracy = (withinCI / dpsValues.length) * 100;

      // MAE (Mean Absolute Error) - 평균 대비
      const mae = dpsValues.reduce((sum, val) => sum + Math.abs(val - mean), 0) / dpsValues.length;

      // 기간 계산
      const firstDate = new Date(tickerDividends[0].date);
      const lastDate = new Date(tickerDividends[tickerDividends.length - 1].date);
      const period = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));

      // 트렌드 계산 (최근 3개 vs 이전 3개 비교)
      let trend = '--';
      if (dpsValues.length >= 6) {
        const recent = dpsValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const older = dpsValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
        const change = ((recent - older) / older) * 100;
        if (change > 5) trend = '↑ 상승';
        else if (change < -5) trend = '↓ 하락';
        else trend = '→ 유지';
      } else if (dpsValues.length >= 2) {
        const recent = dpsValues[dpsValues.length - 1];
        const older = dpsValues[0];
        const change = ((recent - older) / older) * 100;
        if (change > 5) trend = '↑ 상승';
        else if (change < -5) trend = '↓ 하락';
        else trend = '→ 유지';
      }

      return {
        ticker: asset.ticker,
        accuracy,
        ciLow,
        ciHigh,
        dataPoints: dpsValues.length,
        period,
        mae,
        trend,
      };
    });
  }, [incomeAssets, dividends]);

  // 전체 통계
  const totalStats = useMemo(() => {
    if (dividends.length === 0) {
      return { dataPoints: 0, period: '--', avgMae: '--', avgTrend: '--' };
    }

    const sorted = [...dividends].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const period = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));

    const avgMae = learningStats.length > 0 
      ? learningStats.reduce((sum, s) => sum + s.mae, 0) / learningStats.length 
      : 0;

    // 전체 트렌드
    const trends = learningStats.map(s => s.trend);
    let avgTrend = '--';
    if (trends.includes('↑ 상승') && !trends.includes('↓ 하락')) avgTrend = '↑ 상승';
    else if (trends.includes('↓ 하락') && !trends.includes('↑ 상승')) avgTrend = '↓ 하락';
    else if (trends.length > 0 && trends.every(t => t === '→ 유지')) avgTrend = '→ 유지';

    return { 
      dataPoints: dividends.length, 
      period: `${period}일`,
      avgMae: `$${avgMae.toFixed(4)}`,
      avgTrend,
    };
  }, [dividends, learningStats]);

  if (incomeAssets.length === 0) {
    return (
      <div className="text-center py-8 opacity-70">
        <i className="fas fa-brain text-3xl mb-3 opacity-30" />
        <div className="text-sm">INCOME 자산이 없습니다</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Accuracy */}
      <div className="inner-glass p-3 rounded">
        <div className="text-[9px] opacity-70 tracking-widest mb-2 font-light">ACCURACY</div>
        <div className="space-y-2">
          {learningStats.map((stat, i) => {
            const isGold = i % 2 === 1;
            return (
              <div key={stat.ticker}>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className={isGold ? 'text-celestial-gold/70 font-light' : 'opacity-70 font-light'}>
                    {stat.ticker}
                  </span>
                  <span className={isGold ? 'text-celestial-gold font-light' : 'opacity-70 font-light'}>
                    {stat.accuracy > 0 ? `${stat.accuracy.toFixed(0)}%` : '--'}
                  </span>
                </div>
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isGold ? 'bg-celestial-gold/10' : 'bg-white/5'}`}>
                  <div 
                    className={`h-full transition-all ${isGold ? 'bg-gradient-to-r from-celestial-gold/50 to-celestial-gold' : 'bg-gradient-to-r from-white/30 to-white/60'}`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
              </div>
            );
          })}
          {learningStats.length === 0 && (
            <div className="text-[9px] opacity-60 text-center py-2">데이터 없음</div>
          )}
        </div>
      </div>

      {/* 95% CI */}
      <div className="inner-glass p-3 rounded">
        <div className="text-[9px] opacity-70 tracking-widest mb-2 font-light">95% CI</div>
        <div className="space-y-2 text-[9px] font-light">
          {learningStats.map((stat, i) => {
            const isGold = i % 2 === 1;
            return (
              <div 
                key={stat.ticker}
                className={`p-2 rounded border ${isGold ? 'bg-celestial-gold/5 border-celestial-gold/20' : 'bg-white/5 border-white/10'}`}
              >
                <div className={isGold ? 'text-celestial-gold/50 mb-0.5' : 'opacity-70 mb-0.5'}>
                  {stat.ticker}
                </div>
                <div className="text-white">
                  {stat.dataPoints >= 2 
                    ? `$${stat.ciLow.toFixed(4)} - $${stat.ciHigh.toFixed(4)}`
                    : '$0.00 - $0.00'
                  }
                </div>
              </div>
            );
          })}
          {learningStats.length === 0 && (
            <div className="text-[9px] opacity-60 text-center py-2">데이터 없음</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="inner-glass p-3 rounded">
        <div className="text-[9px] opacity-70 tracking-widest mb-2 font-light">STATS</div>
        <div className="space-y-1 text-[9px] font-light">
          <div className="flex justify-between">
            <span className="opacity-60">Data Points</span>
            <span className="text-white">{totalStats.dataPoints}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Period</span>
            <span className="text-white">{totalStats.period}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">MAE</span>
            <span className="opacity-70">{totalStats.avgMae}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Trend</span>
            <span className={`${
              totalStats.avgTrend.includes('↑') ? 'text-v64-success' :
              totalStats.avgTrend.includes('↓') ? 'text-v64-danger' : 'text-white'
            }`}>
              {totalStats.avgTrend}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
