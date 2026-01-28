'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { formatUSD } from '@/lib/utils';
import { FREEDOM_CONFIG } from '@/lib/config';
import { GeopoliticalRiskLevel } from '@/lib/types';

// ═══════════════════════════════════════════════════════════════
// STRESS TEST COMPACT - Mission Control Layout
// 컴팩트한 스트레스 테스트
// ═══════════════════════════════════════════════════════════════

const SCENARIOS = {
  'covid-2020': {
    name: 'COVID-19',
    icon: '🦠',
    year: '2020',
    spReturn: -34,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -25, Healthcare: -15, Finance: -40, Energy: -55,
      Consumer: -30, Industrial: -35, Communication: -20, RealEstate: -35,
      Utilities: -25, Materials: -30, Other: -30,
    },
  },
  'gfc-2008': {
    name: '금융위기',
    icon: '🏦',
    year: '2008',
    spReturn: -57,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -45, Healthcare: -35, Finance: -80, Energy: -50,
      Consumer: -45, Industrial: -55, Communication: -35, RealEstate: -65,
      Utilities: -30, Materials: -55, Other: -50,
    },
  },
  'dotcom-2000': {
    name: '닷컴 버블',
    icon: '💻',
    year: '2000',
    spReturn: -49,
    geopoliticalLevel: 'ORANGE' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -85, Healthcare: -25, Finance: -30, Energy: 10,
      Consumer: -35, Industrial: -40, Communication: -70, RealEstate: -20,
      Utilities: -15, Materials: -30, Other: -40,
    },
  },
  'rate-2022': {
    name: '금리 인상',
    icon: '📈',
    year: '2022',
    spReturn: -25,
    geopoliticalLevel: 'ORANGE' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -35, Healthcare: -15, Finance: -20, Energy: 40,
      Consumer: -25, Industrial: -20, Communication: -40, RealEstate: -30,
      Utilities: -5, Materials: -10, Other: -20,
    },
  },
  'taiwan': {
    name: '대만 위기',
    icon: '🇹🇼',
    year: '가상',
    spReturn: -30,
    geopoliticalLevel: 'RED' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -45, Healthcare: -15, Finance: -25, Energy: 15,
      Consumer: -20, Industrial: -30, Communication: -35, RealEstate: -20,
      Utilities: -10, Materials: -25, Other: -25,
    },
  },
  'mild': {
    name: '일반 조정',
    icon: '📊',
    year: '상시',
    spReturn: -10,
    geopoliticalLevel: 'YELLOW' as GeopoliticalRiskLevel,
    sectorImpacts: {
      Technology: -12, Healthcare: -8, Finance: -12, Energy: -10,
      Consumer: -10, Industrial: -10, Communication: -12, RealEstate: -12,
      Utilities: -6, Materials: -10, Other: -10,
    },
  },
};

type ScenarioKey = keyof typeof SCENARIOS;

export default function StressTestCompact() {
  const { state } = useNexus();
  const { assets } = state;
  const [selected, setSelected] = useState<ScenarioKey>('covid-2020');

  // 포트폴리오 분석
  const portfolioAnalysis = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);

    // 섹터별 가치
    const sectorValues: Record<string, number> = {};
    assets.forEach(a => {
      const value = a.qty * a.price;
      const sector = a.sector || 'Other';
      sectorValues[sector] = (sectorValues[sector] || 0) + value;
    });

    return { totalValue, sectorValues };
  }, [assets]);

  // 스트레스 테스트 결과
  const result = useMemo(() => {
    const scenario = SCENARIOS[selected];
    const { sectorImpacts } = scenario;

    let stressedValue = 0;
    const worstAssets: Array<{ ticker: string; loss: number; lossPct: number }> = [];

    assets.forEach(a => {
      const value = a.qty * a.price;
      const sector = a.sector || 'Other';
      const impact = sectorImpacts[sector as keyof typeof sectorImpacts] || sectorImpacts.Other;
      const stressedAssetValue = value * (1 + impact / 100);
      stressedValue += stressedAssetValue;

      worstAssets.push({
        ticker: a.ticker,
        loss: stressedAssetValue - value,
        lossPct: impact,
      });
    });

    const totalLoss = stressedValue - portfolioAnalysis.totalValue;
    const totalLossPct = portfolioAnalysis.totalValue > 0
      ? (totalLoss / portfolioAnalysis.totalValue) * 100
      : 0;

    // 가장 큰 손실/방어
    const sorted = [...worstAssets].sort((a, b) => a.lossPct - b.lossPct);
    const worst = sorted.slice(0, 2);
    const best = sorted.slice(-2).reverse();

    // 방어력 점수
    const defenseScore = totalLossPct > scenario.spReturn ? 'BETTER' : 'WORSE';
    const defenseGap = totalLossPct - scenario.spReturn;

    return {
      scenario,
      stressedValue,
      totalLoss,
      totalLossPct,
      worst,
      best,
      defenseScore,
      defenseGap,
    };
  }, [selected, assets, portfolioAnalysis]);

  if (assets.length === 0) {
    return null;
  }

  const riskInfo = FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[result.scenario.geopoliticalLevel];

  return (
    <div className="inner-glass p-4 rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] tracking-widest text-orange-400 flex items-center gap-2">
          <i className="fas fa-bolt" />
          STRESS TEST
        </h4>
        <span
          className="text-[8px] px-2 py-0.5 rounded"
          style={{
            backgroundColor: `${riskInfo.color}20`,
            color: riskInfo.color,
          }}
        >
          {riskInfo.emoji} {result.scenario.geopoliticalLevel}
        </span>
      </div>

      {/* Scenario Selector */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map(key => {
          const s = SCENARIOS[key];
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`px-2 py-1 text-[8px] rounded-lg border transition-all flex items-center gap-1 ${
                isSelected
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Scenario Info */}
      <div className="bg-white/5 p-2 rounded-lg mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-medium text-white">{result.scenario.name}</div>
          <div className="text-[8px] text-white/70">{result.scenario.year}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px] text-white/60">S&P 500</div>
          <div className="text-[11px] text-v64-danger font-mono">{result.scenario.spReturn}%</div>
        </div>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <div className="text-[7px] text-white/60">예상 손실</div>
          <div className="text-[13px] font-display text-v64-danger">
            {formatUSD(result.totalLoss)}
          </div>
        </div>
        <div className="bg-white/5 p-2 rounded-lg text-center">
          <div className="text-[7px] text-white/60">하락률</div>
          <div className="text-[13px] font-display text-v64-danger">
            {result.totalLossPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Visual Bar */}
      <div className="mb-3">
        <div className="text-[8px] text-white/60 mb-1">포트폴리오 영향</div>
        <div className="relative h-5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-v64-danger/60 to-v64-danger/30 rounded-full transition-all"
            style={{ width: `${Math.max(5, Math.min(100, (result.stressedValue / portfolioAnalysis.totalValue) * 100))}%` }}
          />
          <div className="absolute inset-0 flex items-center px-2 justify-between text-[8px]">
            <span className="text-white/70">{formatUSD(result.stressedValue)}</span>
            <span className="text-v64-danger font-medium">{result.totalLossPct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Worst & Best */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-v64-danger/10 p-2 rounded-lg">
          <div className="text-[7px] text-v64-danger mb-1 flex items-center gap-1">
            <i className="fas fa-arrow-down" /> 최대 손실
          </div>
          {result.worst.map(a => (
            <div key={a.ticker} className="flex justify-between text-[9px]">
              <span className="text-white/70">{a.ticker}</span>
              <span className="text-v64-danger">{a.lossPct}%</span>
            </div>
          ))}
        </div>
        <div className="bg-celestial-cyan/10 p-2 rounded-lg">
          <div className="text-[7px] text-celestial-cyan mb-1 flex items-center gap-1">
            <i className="fas fa-shield-alt" /> 상대적 방어
          </div>
          {result.best.map(a => (
            <div key={a.ticker} className="flex justify-between text-[9px]">
              <span className="text-white/70">{a.ticker}</span>
              <span className={a.lossPct >= 0 ? 'text-v64-success' : 'text-celestial-gold'}>
                {a.lossPct >= 0 ? '+' : ''}{a.lossPct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Defense Score */}
      <div className="bg-white/5 p-2 rounded-lg grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[7px] text-white/60">방어력</div>
          <div className={`text-[11px] font-bold ${
            Math.abs(result.totalLossPct) < 20 ? 'text-v64-success' :
            Math.abs(result.totalLossPct) < 35 ? 'text-celestial-gold' : 'text-v64-danger'
          }`}>
            {Math.abs(result.totalLossPct) < 20 ? 'HIGH' :
             Math.abs(result.totalLossPct) < 35 ? 'MED' : 'LOW'}
          </div>
        </div>
        <div>
          <div className="text-[7px] text-white/60">시장 대비</div>
          <div className={`text-[11px] font-bold ${
            result.defenseScore === 'BETTER' ? 'text-v64-success' : 'text-v64-danger'
          }`}>
            {result.defenseScore}
          </div>
        </div>
        <div>
          <div className="text-[7px] text-white/60">차이</div>
          <div className={`text-[11px] font-bold ${
            result.defenseGap > 0 ? 'text-v64-success' : 'text-v64-danger'
          }`}>
            {result.defenseGap > 0 ? '+' : ''}{result.defenseGap.toFixed(1)}%p
          </div>
        </div>
      </div>
    </div>
  );
}
