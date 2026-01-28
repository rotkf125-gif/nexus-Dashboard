'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';

interface TargetWeight {
  ticker: string;
  target: number;
}

export default function RebalanceSimulator() {
  const { state } = useNexus();
  const { assets, exchangeRate } = state;

  // 목표 비중 상태 (기본값: 균등 배분)
  const [targetWeights, setTargetWeights] = useState<TargetWeight[]>(() => {
    const equalWeight = assets.length > 0 ? Math.floor(100 / assets.length) : 0;
    return assets.map(a => ({ ticker: a.ticker, target: equalWeight }));
  });

  // 현재 포트폴리오 계산
  const portfolio = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    
    return assets.map(a => {
      const value = a.qty * a.price;
      const currentWeight = totalValue > 0 ? (value / totalValue) * 100 : 0;
      const targetWeight = targetWeights.find(t => t.ticker === a.ticker)?.target || 0;
      const diff = targetWeight - currentWeight;
      const adjustValue = (diff / 100) * totalValue;
      const adjustQty = a.price > 0 ? Math.round(adjustValue / a.price) : 0;

      return {
        ticker: a.ticker,
        qty: a.qty,
        price: a.price,
        value,
        currentWeight,
        targetWeight,
        diff,
        adjustQty,
        adjustValue,
      };
    });
  }, [assets, targetWeights]);

  const totalValue = useMemo(() => 
    assets.reduce((sum, a) => sum + a.qty * a.price, 0), 
    [assets]
  );

  const totalTargetWeight = useMemo(() => 
    targetWeights.reduce((sum, t) => sum + t.target, 0),
    [targetWeights]
  );

  // 목표 비중 변경
  const handleTargetChange = (ticker: string, value: number) => {
    setTargetWeights(prev => 
      prev.map(t => t.ticker === ticker ? { ...t, target: Math.max(0, Math.min(100, value)) } : t)
    );
  };

  // 균등 배분
  const handleEqualDistribute = () => {
    const equalWeight = assets.length > 0 ? Math.floor(100 / assets.length) : 0;
    setTargetWeights(assets.map(a => ({ ticker: a.ticker, target: equalWeight })));
  };

  // 현재 비중으로 설정
  const handleSetToCurrent = () => {
    setTargetWeights(portfolio.map(p => ({ 
      ticker: p.ticker, 
      target: Math.round(p.currentWeight) 
    })));
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-8 opacity-70">
        <i className="fas fa-balance-scale text-2xl mb-3 opacity-30" />
        <div className="text-[10px]">자산을 추가하세요</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleEqualDistribute}
          className="flex-1 text-[8px] py-1.5 px-2 rounded border border-white/20 hover:bg-white/5 transition-colors"
        >
          균등 배분
        </button>
        <button
          onClick={handleSetToCurrent}
          className="flex-1 text-[8px] py-1.5 px-2 rounded border border-white/20 hover:bg-white/5 transition-colors"
        >
          현재 유지
        </button>
      </div>

      {/* Total Weight Indicator */}
      <div className={`text-[9px] text-center py-1 rounded ${
        totalTargetWeight === 100 
          ? 'bg-v64-success/10 text-v64-success' 
          : 'bg-v64-warning/10 text-v64-warning'
      }`}>
        목표 합계: {totalTargetWeight}% {totalTargetWeight !== 100 && '(100% 권장)'}
      </div>

      {/* Asset List */}
      <div className="space-y-2">
        {portfolio.map((p) => (
          <div key={p.ticker} className="inner-glass p-3 rounded-lg">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-display tracking-wider">{p.ticker}</span>
              <span className={`text-[10px] font-mono ${
                p.diff > 0 ? 'text-v64-success' : p.diff < 0 ? 'text-v64-danger' : 'text-white/70'
              }`}>
                {p.diff > 0 ? '+' : ''}{p.diff.toFixed(1)}%
              </span>
            </div>

            {/* Weight Bars */}
            <div className="space-y-1 mb-2">
              {/* Current */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] opacity-60 w-8">현재</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white/40 transition-all"
                    style={{ width: `${Math.min(100, p.currentWeight)}%` }}
                  />
                </div>
                <span className="text-[9px] opacity-60 w-10 text-right">{p.currentWeight.toFixed(1)}%</span>
              </div>
              {/* Target */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-v64-success/60 w-8">목표</span>
                <div className="flex-1 h-1.5 bg-v64-success/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-v64-success/60 transition-all"
                    style={{ width: `${Math.min(100, p.targetWeight)}%` }}
                  />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={p.targetWeight}
                  onChange={(e) => handleTargetChange(p.ticker, parseInt(e.target.value) || 0)}
                  className="w-10 text-[9px] text-right bg-transparent border-b border-white/20 focus:border-v64-success outline-none text-v64-success"
                />
              </div>
            </div>

            {/* Adjustment Suggestion */}
            {p.adjustQty !== 0 && (
              <div className={`text-[9px] pt-2 border-t border-white/10 ${
                p.adjustQty > 0 ? 'text-v64-success' : 'text-v64-danger'
              }`}>
                <i className={`fas fa-${p.adjustQty > 0 ? 'arrow-up' : 'arrow-down'} mr-1`} />
                {Math.abs(p.adjustQty)}주 {p.adjustQty > 0 ? '매수' : '매도'}
                <span className="opacity-60 ml-1">
                  (${Math.abs(p.adjustValue).toFixed(0)})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="inner-glass p-3 rounded-lg border border-celestial-purple/20">
        <div className="text-[9px] text-celestial-purple tracking-widest mb-2">REBALANCE SUMMARY</div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="opacity-60">총 평가금</span>
            <div className="text-white">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div>
            <span className="opacity-60">필요 거래</span>
            <div className="text-white">
              {portfolio.filter(p => p.adjustQty !== 0).length}건
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
