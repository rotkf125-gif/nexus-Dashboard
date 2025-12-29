'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';

export default function WhatIfSimulator() {
  const { state } = useNexus();
  
  const [rateChange, setRateChange] = useState(0);       // bp (-100 to +100)
  const [nasdaqChange, setNasdaqChange] = useState(0);   // % (-30 to +30)
  const [krwRate, setKrwRate] = useState(state.exchangeRate || 1450);
  const [vixLevel, setVixLevel] = useState(15);

  // 시나리오 영향 계산
  const impacts = useMemo(() => {
    // 금리 변동 영향 (CORE 자산에 영향)
    // 금리 +100bp → 약 -10% 주가 영향 (성장주 기준)
    const rateImpact = -(rateChange / 100) * 0.1;

    // NASDAQ 변동 영향 (Tech 섹터에 더 큰 영향)
    const techWeight = state.assets
      .filter(a => a.sector === 'Technology' || a.sector === 'ETF')
      .reduce((sum, a) => sum + (a.qty * a.price), 0);
    const totalValue = state.assets.reduce((sum, a) => sum + (a.qty * a.price), 0);
    const techRatio = totalValue > 0 ? techWeight / totalValue : 0;
    const nasdaqImpact = (nasdaqChange / 100) * (0.7 + techRatio * 0.3);

    // 환율 변동 영향 (원화 환산 가치)
    const krwImpact = ((krwRate - state.exchangeRate) / state.exchangeRate);

    // VIX 영향 (MDD 추정)
    // VIX 15 = 정상, VIX 30 = -10%, VIX 50 = -25%, VIX 80 = -40%
    let vixMdd = 0;
    if (vixLevel <= 15) vixMdd = 0;
    else if (vixLevel <= 25) vixMdd = -(vixLevel - 15) * 0.5;
    else if (vixLevel <= 40) vixMdd = -5 - (vixLevel - 25) * 1.0;
    else if (vixLevel <= 60) vixMdd = -20 - (vixLevel - 40) * 0.75;
    else vixMdd = -35 - (vixLevel - 60) * 0.5;

    // 총 영향 (가중 평균)
    const totalImpact = (rateImpact * 0.2) + (nasdaqImpact * 0.5) + (vixMdd / 100 * 0.3);

    // 견고성 평가
    let robustness = '';
    let robustnessClass = '';
    const absTotal = Math.abs(totalImpact * 100);
    if (absTotal < 3) {
      robustness = '견고';
      robustnessClass = 'text-v64-success';
    } else if (absTotal < 7) {
      robustness = '양호';
      robustnessClass = 'text-celestial-gold';
    } else if (absTotal < 15) {
      robustness = '주의';
      robustnessClass = 'text-v64-warning';
    } else {
      robustness = '위험';
      robustnessClass = 'text-v64-danger';
    }

    return {
      rateImpact: (rateImpact * 100).toFixed(1),
      nasdaqImpact: (nasdaqImpact * 100).toFixed(1),
      krwImpact: (krwImpact * 100).toFixed(1),
      vixMdd: vixMdd.toFixed(1),
      totalImpact: (totalImpact * 100).toFixed(1),
      robustness,
      robustnessClass,
    };
  }, [rateChange, nasdaqChange, krwRate, vixLevel, state.assets, state.exchangeRate]);

  const handleReset = () => {
    setRateChange(0);
    setNasdaqChange(0);
    setKrwRate(state.exchangeRate || 1450);
    setVixLevel(15);
  };

  return (
    <div className="space-y-3">
      {/* Interest Rate */}
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-white/50 font-medium">금리 변동</span>
          <span className="text-[11px] text-white font-mono font-medium">
            {rateChange > 0 ? '+' : ''}{rateChange}bp
          </span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={rateChange}
          onChange={(e) => setRateChange(parseInt(e.target.value))}
          className="scenario-slider w-full"
        />
        <div className={`text-[10px] font-mono mt-1 font-medium ${
          parseFloat(impacts.rateImpact) >= 0 ? 'text-v64-success' : 'text-v64-danger'
        }`}>
          영향: {impacts.rateImpact}%
        </div>
      </div>

      {/* NASDAQ */}
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-white/50 font-medium">NASDAQ 변동</span>
          <span className="text-[11px] text-white font-mono font-medium">
            {nasdaqChange > 0 ? '+' : ''}{nasdaqChange}%
          </span>
        </div>
        <input
          type="range"
          min="-30"
          max="30"
          value={nasdaqChange}
          onChange={(e) => setNasdaqChange(parseInt(e.target.value))}
          className="scenario-slider w-full"
        />
        <div className={`text-[10px] font-mono mt-1 font-medium ${
          parseFloat(impacts.nasdaqImpact) >= 0 ? 'text-v64-success' : 'text-v64-danger'
        }`}>
          영향: {impacts.nasdaqImpact}%
        </div>
      </div>

      {/* USD/KRW */}
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-white/50 font-medium">USD/KRW</span>
          <span className="text-[11px] text-white font-mono font-medium">
            ₩{krwRate.toLocaleString()}
          </span>
        </div>
        <input
          type="range"
          min="1200"
          max="1600"
          value={krwRate}
          onChange={(e) => setKrwRate(parseInt(e.target.value))}
          className="scenario-slider w-full"
        />
        <div className={`text-[10px] font-mono mt-1 font-medium ${
          parseFloat(impacts.krwImpact) >= 0 ? 'text-v64-success' : 'text-v64-danger'
        }`}>
          원화 환산: {parseFloat(impacts.krwImpact) > 0 ? '+' : ''}{impacts.krwImpact}%
        </div>
      </div>

      {/* VIX Spike */}
      <div className="inner-glass p-3 rounded-xl">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-white/50 font-medium">VIX 급등</span>
          <span className="text-[11px] text-white font-mono font-medium">{vixLevel}</span>
        </div>
        <input
          type="range"
          min="10"
          max="80"
          value={vixLevel}
          onChange={(e) => setVixLevel(parseInt(e.target.value))}
          className="scenario-slider w-full"
        />
        <div className="text-[10px] text-v64-danger font-mono mt-1 font-medium">
          예상 MDD: {impacts.vixMdd}%
        </div>
      </div>

      {/* Scenario Summary */}
      <div className="inner-glass p-4 rounded-xl border border-celestial-purple/20">
        <div className="text-[10px] text-celestial-purple tracking-widest mb-1 font-medium">
          SCENARIO RESULT
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-white/50 font-medium">예상 포트폴리오 변동</span>
          <span className={`text-lg font-semibold font-display ${
            parseFloat(impacts.totalImpact) >= 0 ? 'text-v64-success' : 'text-v64-danger'
          }`}>
            {parseFloat(impacts.totalImpact) > 0 ? '+' : ''}{impacts.totalImpact}%
          </span>
        </div>
        <div className={`text-[11px] font-mono mt-1 font-medium ${impacts.robustnessClass}`}>
          견고성: <span className={impacts.robustnessClass}>● {impacts.robustness}</span>
        </div>
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="text-[10px] text-white/40 hover:text-white transition-colors w-full text-center py-2"
      >
        RESET
      </button>
    </div>
  );
}
