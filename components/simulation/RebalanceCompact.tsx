'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { CHART_COLORS } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════
// REBALANCE COMPACT - Mission Control Layout
// 컴팩트한 리밸런싱 시뮬레이터
// ═══════════════════════════════════════════════════════════════

interface TargetWeight {
  ticker: string;
  target: number;
}

export default function RebalanceCompact() {
  const { state } = useNexus();
  const { assets } = state;

  // 동일 티커 병합
  const mergedAssets = useMemo(() => {
    const merged: Record<string, { ticker: string; qty: number; price: number; avg: number; value: number }> = {};
    assets.forEach(a => {
      const value = a.qty * a.price;
      if (!merged[a.ticker]) {
        merged[a.ticker] = { ticker: a.ticker, qty: a.qty, price: a.price, avg: a.avg, value };
      } else {
        merged[a.ticker].qty += a.qty;
        merged[a.ticker].value += value;
      }
    });
    return Object.values(merged);
  }, [assets]);

  // 목표 비중 상태
  const [targetWeights, setTargetWeights] = useState<TargetWeight[]>(() => {
    const equalWeight = mergedAssets.length > 0 ? Math.floor(100 / mergedAssets.length) : 0;
    return mergedAssets.map(a => ({ ticker: a.ticker, target: equalWeight }));
  });

  // 현재 포트폴리오 계산
  const portfolio = useMemo(() => {
    const totalValue = mergedAssets.reduce((sum, a) => sum + a.value, 0);

    return mergedAssets.map(a => {
      const currentWeight = totalValue > 0 ? (a.value / totalValue) * 100 : 0;
      const targetWeight = targetWeights.find(t => t.ticker === a.ticker)?.target || 0;
      const diff = targetWeight - currentWeight;
      const adjustValue = (diff / 100) * totalValue;
      const adjustQty = a.price > 0 ? Math.round(adjustValue / a.price) : 0;

      return {
        ticker: a.ticker,
        value: a.value,
        price: a.price,
        currentWeight,
        targetWeight,
        diff,
        adjustQty,
        adjustValue,
      };
    }).sort((a, b) => b.value - a.value);
  }, [mergedAssets, targetWeights]);

  const totalValue = useMemo(() =>
    mergedAssets.reduce((sum, a) => sum + a.value, 0),
    [mergedAssets]
  );

  const totalTargetWeight = useMemo(() =>
    targetWeights.reduce((sum, t) => sum + t.target, 0),
    [targetWeights]
  );

  const tradesNeeded = useMemo(() =>
    portfolio.filter(p => p.adjustQty !== 0).length,
    [portfolio]
  );

  // 목표 비중 변경
  const handleTargetChange = (ticker: string, value: number) => {
    setTargetWeights(prev =>
      prev.map(t => t.ticker === ticker ? { ...t, target: Math.max(0, Math.min(100, value)) } : t)
    );
  };

  // 균등 배분
  const handleEqualDistribute = () => {
    const equalWeight = mergedAssets.length > 0 ? Math.floor(100 / mergedAssets.length) : 0;
    setTargetWeights(mergedAssets.map(a => ({ ticker: a.ticker, target: equalWeight })));
  };

  // 현재 비중으로 설정
  const handleSetToCurrent = () => {
    setTargetWeights(portfolio.map(p => ({
      ticker: p.ticker,
      target: Math.round(p.currentWeight)
    })));
  };

  if (mergedAssets.length === 0) {
    return null;
  }

  return (
    <div className="inner-glass p-4 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] tracking-widest text-v64-success flex items-center gap-2">
          <i className="fas fa-balance-scale" />
          REBALANCE OPTIMIZER
        </h4>
        <div className={`text-[9px] px-2 py-0.5 rounded ${
          totalTargetWeight === 100
            ? 'bg-v64-success/20 text-v64-success'
            : 'bg-orange-500/20 text-orange-400'
        }`}>
          {totalTargetWeight}%
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleEqualDistribute}
          className="flex-1 text-[8px] py-1.5 px-2 rounded border border-white/20 hover:bg-white/5 transition-colors"
        >
          <i className="fas fa-equals mr-1" />
          균등 배분
        </button>
        <button
          onClick={handleSetToCurrent}
          className="flex-1 text-[8px] py-1.5 px-2 rounded border border-white/20 hover:bg-white/5 transition-colors"
        >
          <i className="fas fa-check mr-1" />
          현재 유지
        </button>
      </div>

      {/* Asset List - Compact */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
        {portfolio.slice(0, 8).map((p, i) => (
          <div key={p.ticker} className="bg-white/5 p-2 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-[10px] font-medium flex-1">{p.ticker}</span>
              <span className={`text-[9px] font-mono ${
                p.diff > 0 ? 'text-v64-success' : p.diff < 0 ? 'text-v64-danger' : 'text-white/60'
              }`}>
                {p.diff > 0 ? '+' : ''}{p.diff.toFixed(1)}%
              </span>
            </div>

            {/* Weight Bars */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 bg-white/10 rounded relative overflow-hidden">
                {/* Current */}
                <div
                  className="absolute top-0 left-0 h-1/2 bg-white/30"
                  style={{ width: `${Math.min(100, p.currentWeight)}%` }}
                />
                {/* Target */}
                <div
                  className="absolute bottom-0 left-0 h-1/2 bg-v64-success/50"
                  style={{ width: `${Math.min(100, p.targetWeight)}%` }}
                />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={p.targetWeight}
                onChange={(e) => handleTargetChange(p.ticker, parseInt(e.target.value) || 0)}
                className="w-10 text-[9px] text-center bg-white/10 border border-white/20 rounded py-0.5 focus:border-v64-success outline-none"
              />
            </div>

            {/* Trade Suggestion */}
            {p.adjustQty !== 0 && (
              <div className={`text-[8px] mt-1 ${p.adjustQty > 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                <i className={`fas fa-${p.adjustQty > 0 ? 'arrow-up' : 'arrow-down'} mr-1`} />
                {Math.abs(p.adjustQty)}주 {p.adjustQty > 0 ? '매수' : '매도'}
                <span className="opacity-60 ml-1">(${Math.abs(p.adjustValue).toFixed(0)})</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[7px] text-white/60">총 평가금</div>
          <div className="text-[10px] font-display text-white">
            ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-[7px] text-white/60">필요 거래</div>
          <div className="text-[10px] font-display text-celestial-cyan">{tradesNeeded}건</div>
        </div>
        <div>
          <div className="text-[7px] text-white/60">종목 수</div>
          <div className="text-[10px] font-display text-white">{mergedAssets.length}</div>
        </div>
      </div>
    </div>
  );
}
