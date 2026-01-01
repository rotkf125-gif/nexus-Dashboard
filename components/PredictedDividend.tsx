'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';

interface PredictionData {
  ticker: string;
  predictedDps: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  nextDate: string;
  history: number[];
}

export default function PredictedDividend() {
  const { state } = useNexus();
  const { assets, dividends } = state;

  // INCOME 자산 필터링
  const incomeAssets = useMemo(() => {
    return assets.filter(a => a.type === 'INCOME');
  }, [assets]);

  // 배당 예측 계산
  const predictions = useMemo<PredictionData[]>(() => {
    return incomeAssets.map(asset => {
      // 해당 종목의 최근 배당 기록 (최근 6개)
      const tickerDividends = dividends
        .filter(d => d.ticker === asset.ticker)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

      const dpsHistory = tickerDividends.map(d => d.dps);

      if (dpsHistory.length === 0) {
        return {
          ticker: asset.ticker,
          predictedDps: 0,
          confidence: 0,
          trend: 'stable' as const,
          nextDate: getNextThursday(),
          history: [],
        };
      }

      // 간단한 이동평균 기반 예측
      const avgDps = dpsHistory.reduce((sum, d) => sum + d, 0) / dpsHistory.length;
      
      // 최근 3개 평균 vs 전체 평균으로 트렌드 파악
      const recentAvg = dpsHistory.slice(0, 3).reduce((sum, d) => sum + d, 0) / Math.min(3, dpsHistory.length);
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentAvg > avgDps * 1.05) trend = 'up';
      else if (recentAvg < avgDps * 0.95) trend = 'down';

      // 표준편차 기반 신뢰도 (변동이 적을수록 높은 신뢰도)
      const variance = dpsHistory.reduce((sum, d) => sum + Math.pow(d - avgDps, 2), 0) / dpsHistory.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgDps > 0 ? stdDev / avgDps : 0; // 변동계수
      const confidence = Math.max(50, Math.min(98, 100 - cv * 100));

      // 예측 DPS (최근 트렌드 반영)
      const predictedDps = trend === 'up' 
        ? recentAvg * 1.02 
        : trend === 'down' 
          ? recentAvg * 0.98 
          : recentAvg;

      return {
        ticker: asset.ticker,
        predictedDps,
        confidence,
        trend,
        nextDate: getNextThursday(),
        history: dpsHistory.reverse(), // 오래된 것부터
      };
    });
  }, [incomeAssets, dividends]);

  // 다음 목요일 계산
  function getNextThursday() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const nextThursday = new Date(now);
    nextThursday.setDate(now.getDate() + daysUntilThursday);
    return nextThursday.toISOString().split('T')[0];
  }

  if (incomeAssets.length === 0 || predictions.every(p => p.history.length === 0)) {
    return null;
  }

  return (
    <div className="inner-glass p-3 rounded-lg border border-celestial-purple/20">
      <div className="flex items-center gap-2 mb-3">
        <i className="fas fa-crystal-ball text-celestial-purple text-xs" />
        <span className="text-[10px] text-celestial-purple tracking-widest">DIVIDEND PREDICTION</span>
      </div>

      <div className="space-y-2">
        {predictions.filter(p => p.history.length > 0).map((pred) => (
          <div key={pred.ticker} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            {/* Ticker & Trend */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-display">{pred.ticker}</span>
              <span className={`text-[9px] ${
                pred.trend === 'up' ? 'text-v64-success' : 
                pred.trend === 'down' ? 'text-v64-danger' : 
                'text-white/40'
              }`}>
                {pred.trend === 'up' && <i className="fas fa-arrow-trend-up" />}
                {pred.trend === 'down' && <i className="fas fa-arrow-trend-down" />}
                {pred.trend === 'stable' && <i className="fas fa-minus" />}
              </span>
            </div>

            {/* Mini Sparkline */}
            <div className="flex items-end gap-0.5 h-4">
              {pred.history.slice(-5).map((dps, i) => {
                const maxDps = Math.max(...pred.history);
                const height = maxDps > 0 ? (dps / maxDps) * 100 : 50;
                return (
                  <div
                    key={i}
                    className="w-1 bg-celestial-purple/60 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>

            {/* Prediction */}
            <div className="text-right">
              <div className="text-[11px] font-mono text-white">
                ${pred.predictedDps.toFixed(2)}
                <span className="text-[8px] opacity-40 ml-1">±{(pred.predictedDps * 0.05).toFixed(2)}</span>
              </div>
              <div className="text-[8px] opacity-40">
                신뢰도 {pred.confidence.toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Payment Date */}
      <div className="mt-3 pt-2 border-t border-white/10 text-center">
        <span className="text-[9px] opacity-40">예상 지급일: </span>
        <span className="text-[10px] text-celestial-gold">{predictions[0]?.nextDate || '-'}</span>
      </div>
    </div>
  );
}
