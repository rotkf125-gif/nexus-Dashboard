'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { formatUSD } from '@/lib/utils';
import { CHART_COLORS, FREEDOM_CONFIG } from '@/lib/config';
import { GeopoliticalRiskLevel } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 - Enhanced Stress Test
// GeopoliticalRiskAgent + CounterfactualSimulator 통합
// ═══════════════════════════════════════════════════════════════

// 역사적 시나리오 데이터 (v31.0 확장)
const HISTORICAL_SCENARIOS = {
  'covid-2020': {
    name: '2020 COVID-19 Crash',
    description: '2020년 3월 팬데믹 폭락',
    date: '2020-03',
    spReturn: -34,
    nasdaqReturn: -30,
    duration: '1개월',
    recovery: '5개월',
    vixPeak: 82,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -25,
      Healthcare: -15,
      Finance: -40,
      Energy: -55,
      Consumer: -30,
      Industrial: -35,
      Communication: -20,
      RealEstate: -35,
      Utilities: -25,
      Materials: -30,
      Other: -30,
    },
  },
  'gfc-2008': {
    name: '2008 Financial Crisis',
    description: '2008년 글로벌 금융위기',
    date: '2008-09',
    spReturn: -57,
    nasdaqReturn: -56,
    duration: '17개월',
    recovery: '4년',
    vixPeak: 80,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -45,
      Healthcare: -35,
      Finance: -80,
      Energy: -50,
      Consumer: -45,
      Industrial: -55,
      Communication: -35,
      RealEstate: -65,
      Utilities: -30,
      Materials: -55,
      Other: -50,
    },
  },
  'dotcom-2000': {
    name: '2000 Dot-com Bubble',
    description: '2000년 닷컴 버블 붕괴',
    date: '2000-03',
    spReturn: -49,
    nasdaqReturn: -78,
    duration: '30개월',
    recovery: '7년',
    vixPeak: 45,
    geopoliticalLevel: 'ORANGE' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -85,
      Healthcare: -25,
      Finance: -30,
      Energy: +10,
      Consumer: -35,
      Industrial: -40,
      Communication: -70,
      RealEstate: -20,
      Utilities: -15,
      Materials: -30,
      Other: -40,
    },
  },
  'rate-hike-2022': {
    name: '2022 Rate Hike',
    description: '2022년 금리 인상 조정',
    date: '2022-01',
    spReturn: -25,
    nasdaqReturn: -35,
    duration: '10개월',
    recovery: '1년',
    vixPeak: 36,
    geopoliticalLevel: 'ORANGE' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -35,
      Healthcare: -15,
      Finance: -20,
      Energy: +40,
      Consumer: -25,
      Industrial: -20,
      Communication: -40,
      RealEstate: -30,
      Utilities: -5,
      Materials: -10,
      Other: -20,
    },
  },
  // v31.0: 새로운 지정학적 시나리오
  'taiwan-crisis': {
    name: 'Taiwan Crisis',
    description: '대만 해협 위기 시나리오',
    date: 'Hypothetical',
    spReturn: -30,
    nasdaqReturn: -40,
    duration: '6-12개월',
    recovery: '2-3년',
    vixPeak: 55,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -45,
      Healthcare: -15,
      Finance: -25,
      Energy: +15,
      Consumer: -20,
      Industrial: -30,
      Communication: -35,
      RealEstate: -20,
      Utilities: -10,
      Materials: -25,
      Other: -25,
    },
  },
  'energy-crisis': {
    name: 'Energy Crisis',
    description: '글로벌 에너지 위기',
    date: 'Hypothetical',
    spReturn: -20,
    nasdaqReturn: -25,
    duration: '6-12개월',
    recovery: '1-2년',
    vixPeak: 40,
    geopoliticalLevel: 'ORANGE' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -20,
      Healthcare: -10,
      Finance: -15,
      Energy: +50,
      Consumer: -25,
      Industrial: -30,
      Communication: -15,
      RealEstate: -20,
      Utilities: +10,
      Materials: -15,
      Other: -20,
    },
  },
  'custom-mild': {
    name: 'Mild Correction',
    description: '일반적인 조정 (-10%)',
    date: 'Custom',
    spReturn: -10,
    nasdaqReturn: -12,
    duration: '1-2개월',
    recovery: '3-6개월',
    vixPeak: 25,
    geopoliticalLevel: 'YELLOW' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -12,
      Healthcare: -8,
      Finance: -12,
      Energy: -10,
      Consumer: -10,
      Industrial: -10,
      Communication: -12,
      RealEstate: -12,
      Utilities: -6,
      Materials: -10,
      Other: -10,
    },
  },
  'custom-severe': {
    name: 'Severe Bear Market',
    description: '심각한 약세장 (-40%)',
    date: 'Custom',
    spReturn: -40,
    nasdaqReturn: -50,
    duration: '12-18개월',
    recovery: '2-3년',
    vixPeak: 60,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -50,
      Healthcare: -30,
      Finance: -50,
      Energy: -35,
      Consumer: -40,
      Industrial: -45,
      Communication: -45,
      RealEstate: -45,
      Utilities: -25,
      Materials: -40,
      Other: -40,
    },
  },
};

type ScenarioKey = keyof typeof HISTORICAL_SCENARIOS;

export default function StressTest() {
  const { state } = useNexus();
  const { assets, exchangeRate } = state;

  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('covid-2020');

  // 현재 포트폴리오 분석
  const portfolioAnalysis = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalCost = assets.reduce((sum, a) => sum + a.qty * a.avg, 0);

    // 섹터별 가치 계산
    const sectorValues: Record<string, number> = {};
    assets.forEach(a => {
      const value = a.qty * a.price;
      const sector = a.sector || 'Other';
      sectorValues[sector] = (sectorValues[sector] || 0) + value;
    });

    return {
      totalValue,
      totalCost,
      sectorValues,
    };
  }, [assets]);

  // 스트레스 테스트 결과
  const stressResult = useMemo(() => {
    const scenario = HISTORICAL_SCENARIOS[selectedScenario];
    const { sectorImpacts } = scenario;

    let stressedValue = 0;
    const assetResults: Array<{
      ticker: string;
      currentValue: number;
      stressedValue: number;
      loss: number;
      lossPct: number;
    }> = [];

    assets.forEach(a => {
      const currentValue = a.qty * a.price;
      const sector = a.sector || 'Other';
      const impact = sectorImpacts[sector as keyof typeof sectorImpacts] || sectorImpacts.Other;
      const assetStressedValue = currentValue * (1 + impact / 100);

      stressedValue += assetStressedValue;
      assetResults.push({
        ticker: a.ticker,
        currentValue,
        stressedValue: assetStressedValue,
        loss: assetStressedValue - currentValue,
        lossPct: impact,
      });
    });

    const totalLoss = stressedValue - portfolioAnalysis.totalValue;
    const totalLossPct = portfolioAnalysis.totalValue > 0
      ? (totalLoss / portfolioAnalysis.totalValue) * 100
      : 0;

    // 가장 큰 손실 종목
    const worstHits = [...assetResults].sort((a, b) => a.loss - b.loss).slice(0, 3);
    // 가장 적은 손실/이익 종목
    const bestPerformers = [...assetResults].sort((a, b) => b.lossPct - a.lossPct).slice(0, 3);

    return {
      scenario,
      stressedValue,
      totalLoss,
      totalLossPct,
      assetResults,
      worstHits,
      bestPerformers,
    };
  }, [selectedScenario, assets, portfolioAnalysis]);

  if (assets.length === 0) {
    return null;
  }

  const scenario = stressResult.scenario;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] tracking-widest text-orange-400 font-medium uppercase flex items-center gap-2">
          <i className="fas fa-bolt" />
          STRESS TEST
        </h3>
        <span className="text-[9px] text-white/70">
          역사적 시나리오 분석
        </span>
      </div>

      {/* Scenario Selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(HISTORICAL_SCENARIOS) as ScenarioKey[]).map(key => {
          const s = HISTORICAL_SCENARIOS[key];
          const isSelected = selectedScenario === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedScenario(key)}
              className={`px-3 py-1.5 text-[9px] rounded-lg border transition-all ${
                isSelected
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Scenario Info - v31.0 Enhanced */}
      <div className="inner-glass p-3 rounded-lg border-l-2 border-l-orange-500">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-orange-400 font-medium">{scenario.name}</span>
            {/* v31.0: Geopolitical Risk Level Badge */}
            <span 
              className="text-[8px] px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: `${FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[scenario.geopoliticalLevel].color}20`,
                color: FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[scenario.geopoliticalLevel].color,
              }}
            >
              {FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[scenario.geopoliticalLevel].emoji} {scenario.geopoliticalLevel}
            </span>
          </div>
          <span className="text-[9px] text-white/70">{scenario.date}</span>
        </div>
        <p className="text-[10px] text-white/70 mb-2">{scenario.description}</p>
        <div className="flex flex-wrap gap-3 text-[9px]">
          <span className="text-white/60">
            S&P 500: <span className="text-v64-danger">{scenario.spReturn}%</span>
          </span>
          <span className="text-white/60">
            NASDAQ: <span className="text-v64-danger">{scenario.nasdaqReturn}%</span>
          </span>
          <span className="text-white/60">
            VIX Peak: <span className="text-orange-400">{scenario.vixPeak}</span>
          </span>
          <span className="text-white/60">
            기간: {scenario.duration}
          </span>
          <span className="text-white/60">
            회복: {scenario.recovery}
          </span>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[8px] text-white/70 uppercase mb-1">현재 평가금</div>
          <div className="text-[13px] text-white font-semibold">
            {formatUSD(portfolioAnalysis.totalValue)}
          </div>
        </div>
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[8px] text-white/70 uppercase mb-1">예상 평가금</div>
          <div className={`text-[13px] font-semibold ${stressResult.stressedValue < portfolioAnalysis.totalValue ? 'text-v64-danger' : 'text-v64-success'}`}>
            {formatUSD(stressResult.stressedValue)}
          </div>
        </div>
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[8px] text-white/70 uppercase mb-1">예상 손실</div>
          <div className="text-[13px] text-v64-danger font-semibold">
            {formatUSD(stressResult.totalLoss)}
          </div>
        </div>
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[8px] text-white/70 uppercase mb-1">하락률</div>
          <div className="text-[13px] text-v64-danger font-semibold">
            {stressResult.totalLossPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Visual Impact Bar */}
      <div className="inner-glass p-3 rounded-lg">
        <div className="text-[9px] text-white/60 uppercase mb-2">포트폴리오 영향</div>
        <div className="relative h-6 bg-white/10 rounded-full overflow-hidden">
          {/* Stressed Value */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-v64-danger/60 to-v64-danger/30 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, (stressResult.stressedValue / portfolioAnalysis.totalValue) * 100)}%` }}
          />
          {/* Labels */}
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[9px]">
            <span className="text-white/80">
              {formatUSD(stressResult.stressedValue)}
            </span>
            <span className="text-v64-danger font-medium">
              {stressResult.totalLossPct.toFixed(1)}% 하락
            </span>
          </div>
        </div>
      </div>

      {/* Worst & Best Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Worst Hit */}
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[9px] text-v64-danger uppercase mb-2 flex items-center gap-1">
            <i className="fas fa-arrow-down" />
            가장 큰 손실 예상
          </div>
          <div className="space-y-2">
            {stressResult.worstHits.map((asset, i) => (
              <div key={asset.ticker} className="flex items-center justify-between">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {asset.ticker}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-white/60">
                    {formatUSD(asset.currentValue)} →
                  </span>
                  <span className="text-[10px] text-v64-danger">
                    {formatUSD(asset.stressedValue)}
                  </span>
                  <span className="text-[9px] text-v64-danger">
                    ({asset.lossPct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Performers (least loss) */}
        <div className="inner-glass p-3 rounded-lg">
          <div className="text-[9px] text-celestial-cyan uppercase mb-2 flex items-center gap-1">
            <i className="fas fa-shield-alt" />
            상대적 방어
          </div>
          <div className="space-y-2">
            {stressResult.bestPerformers.map((asset, i) => (
              <div key={asset.ticker} className="flex items-center justify-between">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {asset.ticker}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-white/60">
                    {formatUSD(asset.currentValue)} →
                  </span>
                  <span className={`text-[10px] ${asset.lossPct >= 0 ? 'text-v64-success' : 'text-celestial-gold'}`}>
                    {formatUSD(asset.stressedValue)}
                  </span>
                  <span className={`text-[9px] ${asset.lossPct >= 0 ? 'text-v64-success' : 'text-celestial-gold'}`}>
                    ({asset.lossPct >= 0 ? '+' : ''}{asset.lossPct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* v31.0: Resilience Score */}
      <div className="inner-glass p-3 rounded-lg">
        <div className="text-[9px] text-celestial-cyan uppercase mb-2 flex items-center gap-2">
          <i className="fas fa-shield-alt" />
          PORTFOLIO RESILIENCE
          <span className="text-[8px] px-1.5 py-0.5 rounded bg-celestial-purple/20 text-celestial-purple">v31.0</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-[8px] text-white/70 mb-1">방어력</div>
            <div className={`text-[14px] font-bold ${
              Math.abs(stressResult.totalLossPct) < 20 ? 'text-v64-success' :
              Math.abs(stressResult.totalLossPct) < 35 ? 'text-celestial-gold' : 'text-v64-danger'
            }`}>
              {Math.abs(stressResult.totalLossPct) < 20 ? 'HIGH' :
               Math.abs(stressResult.totalLossPct) < 35 ? 'MED' : 'LOW'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-white/70 mb-1">시장 대비</div>
            <div className={`text-[14px] font-bold ${
              stressResult.totalLossPct > scenario.spReturn ? 'text-v64-success' : 'text-v64-danger'
            }`}>
              {stressResult.totalLossPct > scenario.spReturn ? 'BETTER' : 'WORSE'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-white/70 mb-1">분산 효과</div>
            <div className="text-[14px] font-bold text-celestial-cyan">
              {((scenario.spReturn - stressResult.totalLossPct) / Math.abs(scenario.spReturn) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="inner-glass p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
        <div className="flex items-start gap-2">
          <i className="fas fa-exclamation-triangle text-orange-400 text-xs mt-0.5" />
          <div className="text-[9px] text-white/70">
            <span className="text-orange-400 font-medium">주의:</span> 이 분석은 과거 데이터를 기반으로 한 시뮬레이션입니다.
            실제 시장 상황에서는 다른 결과가 나올 수 있으며, 투자 결정의 참고 자료로만 사용하세요.
            <span className="text-celestial-purple ml-1">(Freedom v31.0 CounterfactualSimulator)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
