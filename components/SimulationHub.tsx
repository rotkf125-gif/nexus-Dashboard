'use client';

import { useState, useMemo } from 'react';
import { useNexus } from '@/lib/context';
import { FREEDOM_CONFIG, CHART_COLORS } from '@/lib/config';
import { GeopoliticalRiskLevel } from '@/lib/types';
import StressTestCompact from './simulation/StressTestCompact';
import RebalanceCompact from './simulation/RebalanceCompact';

// ═══════════════════════════════════════════════════════════════
// SIMULATION HUB v2.0 - Mission Control Layout
// What-If + Impact Visualization + Rebalance + Stress Test
// ═══════════════════════════════════════════════════════════════

// 지정학적 시나리오 프리셋
const SCENARIO_PRESETS = {
  'taiwan-crisis': {
    name: '대만 위기',
    icon: '🇹🇼',
    rateChange: 50,
    nasdaqChange: -15,
    vixLevel: 45,
    krwDelta: 100,
  },
  'oil-shock': {
    name: '에너지 위기',
    icon: '🛢️',
    rateChange: 75,
    nasdaqChange: -10,
    vixLevel: 35,
    krwDelta: 80,
  },
  'fed-pivot': {
    name: 'Fed 긴급 인상',
    icon: '🏦',
    rateChange: 100,
    nasdaqChange: -20,
    vixLevel: 40,
    krwDelta: 50,
  },
  'recession': {
    name: '경기 침체',
    icon: '📉',
    rateChange: -100,
    nasdaqChange: -25,
    vixLevel: 50,
    krwDelta: 120,
  },
  'recovery': {
    name: '경기 회복',
    icon: '📈',
    rateChange: -50,
    nasdaqChange: 15,
    vixLevel: 15,
    krwDelta: -50,
  },
};

type PresetKey = keyof typeof SCENARIO_PRESETS;

export default function SimulationHub() {
  const { state } = useNexus();
  const { assets, exchangeRate } = state;

  // 시나리오 상태
  const [rateChange, setRateChange] = useState(0);
  const [nasdaqChange, setNasdaqChange] = useState(0);
  const [krwRate, setKrwRate] = useState(exchangeRate || 1450);
  const [vixLevel, setVixLevel] = useState(15);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null);

  // 포트폴리오 기본 계산
  const portfolioBase = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalCost = assets.reduce((sum, a) => sum + a.qty * a.avg, 0);
    const techWeight = assets
      .filter(a => a.sector === 'Technology' || a.sector === 'Communication')
      .reduce((sum, a) => sum + a.qty * a.price, 0) / (totalValue || 1);

    return { totalValue, totalCost, techWeight };
  }, [assets]);

  // 시나리오 영향 계산
  const impacts = useMemo(() => {
    const rateImpact = -(rateChange / 100) * 0.1;
    const nasdaqImpact = (nasdaqChange / 100) * (0.7 + portfolioBase.techWeight * 0.3);
    const krwImpact = ((krwRate - (exchangeRate || 1450)) / (exchangeRate || 1450));

    let vixMdd = 0;
    if (vixLevel <= 15) vixMdd = 0;
    else if (vixLevel <= 25) vixMdd = -(vixLevel - 15) * 0.5;
    else if (vixLevel <= 40) vixMdd = -5 - (vixLevel - 25) * 1.0;
    else if (vixLevel <= 60) vixMdd = -20 - (vixLevel - 40) * 0.75;
    else vixMdd = -35 - (vixLevel - 60) * 0.5;

    const totalImpact = (rateImpact * 0.2) + (nasdaqImpact * 0.5) + (vixMdd / 100 * 0.3);
    const projectedValue = portfolioBase.totalValue * (1 + totalImpact);
    const projectedChange = projectedValue - portfolioBase.totalValue;

    return {
      rateImpact: rateImpact * 100,
      nasdaqImpact: nasdaqImpact * 100,
      krwImpact: krwImpact * 100,
      vixMdd,
      totalImpact: totalImpact * 100,
      projectedValue,
      projectedChange,
    };
  }, [rateChange, nasdaqChange, krwRate, vixLevel, portfolioBase, exchangeRate]);

  // 리스크 레벨
  const riskLevel = useMemo((): GeopoliticalRiskLevel => {
    if (vixLevel >= 35) return 'RED';
    if (vixLevel >= 25) return 'ORANGE';
    if (vixLevel >= 20) return 'YELLOW';
    return 'GREEN';
  }, [vixLevel]);

  const riskInfo = FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[riskLevel];

  // 섹터별 영향
  const sectorImpacts = useMemo(() => {
    const sectorMap: Record<string, { value: number; impact: number }> = {};

    assets.forEach(a => {
      const value = a.qty * a.price;
      const sector = a.sector || 'Other';
      if (!sectorMap[sector]) {
        sectorMap[sector] = { value: 0, impact: 0 };
      }
      sectorMap[sector].value += value;

      // 섹터별 민감도
      let sectorImpact = impacts.totalImpact;
      if (sector === 'Technology' || sector === 'Communication') {
        sectorImpact *= 1.3;
      } else if (sector === 'Utilities' || sector === 'Healthcare') {
        sectorImpact *= 0.7;
      } else if (sector === 'Energy') {
        sectorImpact *= (nasdaqChange < 0 ? 0.5 : 1.2);
      }
      sectorMap[sector].impact = sectorImpact;
    });

    return Object.entries(sectorMap)
      .map(([sector, data]) => ({
        sector,
        value: data.value,
        weight: (data.value / portfolioBase.totalValue) * 100,
        impact: data.impact,
        projectedChange: data.value * (data.impact / 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [assets, impacts, nasdaqChange, portfolioBase.totalValue]);

  // 프리셋 적용
  const applyPreset = (key: PresetKey) => {
    const preset = SCENARIO_PRESETS[key];
    setRateChange(preset.rateChange);
    setNasdaqChange(preset.nasdaqChange);
    setVixLevel(preset.vixLevel);
    setKrwRate((exchangeRate || 1450) + preset.krwDelta);
    setSelectedPreset(key);
  };

  const handleReset = () => {
    setRateChange(0);
    setNasdaqChange(0);
    setKrwRate(exchangeRate || 1450);
    setVixLevel(15);
    setSelectedPreset(null);
  };

  if (assets.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <i className="fas fa-flask text-4xl text-white/20 mb-4" />
        <div className="text-sm text-white/70">시뮬레이션을 위해 자산을 추가하세요</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Scenario Control + Impact Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Scenario Control (2/5) */}
        <div className="lg:col-span-2 inner-glass p-4 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] tracking-widest text-celestial-cyan flex items-center gap-2">
              <i className="fas fa-sliders-h" />
              SCENARIO CONTROL
            </h4>
            <button
              onClick={handleReset}
              className="text-[8px] text-white/60 hover:text-white/70 transition-colors"
            >
              RESET
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(Object.keys(SCENARIO_PRESETS) as PresetKey[]).map(key => {
              const preset = SCENARIO_PRESETS[key];
              const isSelected = selectedPreset === key;
              return (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`px-2 py-1 text-[9px] rounded-lg border transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-celestial-cyan/20 border-celestial-cyan/50 text-celestial-cyan'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
                  }`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sliders */}
          <div className="space-y-3">
            {/* Rate */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-white/70">금리 변동</span>
                <span className="text-[10px] font-mono text-white">
                  {rateChange > 0 ? '+' : ''}{rateChange}bp
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={rateChange}
                onChange={(e) => { setRateChange(parseInt(e.target.value)); setSelectedPreset(null); }}
                className="scenario-slider w-full"
              />
            </div>

            {/* NASDAQ */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-white/70">NASDAQ</span>
                <span className="text-[10px] font-mono text-white">
                  {nasdaqChange > 0 ? '+' : ''}{nasdaqChange}%
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                value={nasdaqChange}
                onChange={(e) => { setNasdaqChange(parseInt(e.target.value)); setSelectedPreset(null); }}
                className="scenario-slider w-full"
              />
            </div>

            {/* USD/KRW */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-white/70">USD/KRW</span>
                <span className="text-[10px] font-mono text-white">₩{krwRate.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1200"
                max="1600"
                value={krwRate}
                onChange={(e) => { setKrwRate(parseInt(e.target.value)); setSelectedPreset(null); }}
                className="scenario-slider w-full"
              />
            </div>

            {/* VIX */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-white/70">VIX</span>
                <span className="text-[10px] font-mono text-white">{vixLevel}</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                value={vixLevel}
                onChange={(e) => { setVixLevel(parseInt(e.target.value)); setSelectedPreset(null); }}
                className="scenario-slider w-full"
              />
            </div>
          </div>

          {/* Risk Level Badge */}
          <div
            className="mt-4 p-2 rounded-lg flex items-center justify-between"
            style={{ backgroundColor: `${riskInfo.color}10`, borderLeft: `3px solid ${riskInfo.color}` }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{riskInfo.emoji}</span>
              <div>
                <div className="text-[8px] text-white/70">RISK LEVEL</div>
                <div className="text-[10px] font-medium" style={{ color: riskInfo.color }}>
                  {riskInfo.label}
                </div>
              </div>
            </div>
            <div className="text-[9px] text-white/70 text-right max-w-[100px]">
              {riskInfo.action}
            </div>
          </div>
        </div>

        {/* Right: Impact Visualization (3/5) */}
        <div className="lg:col-span-3 inner-glass p-4 rounded-xl">
          <h4 className="text-[10px] tracking-widest text-celestial-purple mb-3 flex items-center gap-2">
            <i className="fas fa-chart-pie" />
            IMPACT VISUALIZATION
          </h4>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <div className="text-[8px] text-white/60">현재 평가금</div>
              <div className="text-[12px] font-display text-white">
                ${portfolioBase.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <div className="text-[8px] text-white/60">예상 평가금</div>
              <div className={`text-[12px] font-display ${impacts.totalImpact >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                ${impacts.projectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <div className="text-[8px] text-white/60">예상 변동</div>
              <div className={`text-[12px] font-display ${impacts.totalImpact >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                {impacts.totalImpact >= 0 ? '+' : ''}{impacts.totalImpact.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 p-2 rounded-lg text-center">
              <div className="text-[8px] text-white/60">예상 MDD</div>
              <div className="text-[12px] font-display text-orange-400">
                {impacts.vixMdd.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Impact Bar */}
          <div className="mb-4">
            <div className="text-[8px] text-white/60 mb-1">포트폴리오 영향도</div>
            <div className="relative h-6 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-1/2 h-full transition-all duration-300 rounded-full ${
                  impacts.totalImpact >= 0 ? 'bg-v64-success/60' : 'bg-v64-danger/60'
                }`}
                style={{
                  width: `${Math.min(50, Math.abs(impacts.totalImpact) * 2)}%`,
                  transform: impacts.totalImpact >= 0 ? 'translateX(0)' : 'translateX(-100%)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-[10px] font-mono font-medium ${
                  impacts.totalImpact >= 0 ? 'text-v64-success' : 'text-v64-danger'
                }`}>
                  {impacts.totalImpact >= 0 ? '+' : ''}{impacts.totalImpact.toFixed(1)}%
                  <span className="text-white/60 ml-2">
                    ({impacts.projectedChange >= 0 ? '+' : ''}${impacts.projectedChange.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Sector Impact Chart */}
          <div className="text-[8px] text-white/60 mb-2">섹터별 영향</div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
            {sectorImpacts.slice(0, 6).map((s, i) => (
              <div key={s.sector} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="text-[9px] text-white/70 w-20 truncate">{s.sector}</span>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute top-0 h-full rounded-full transition-all ${
                      s.impact >= 0 ? 'bg-v64-success/50 left-1/2' : 'bg-v64-danger/50 right-1/2'
                    }`}
                    style={{
                      width: `${Math.min(50, Math.abs(s.impact) * 2)}%`,
                    }}
                  />
                </div>
                <span className={`text-[9px] font-mono w-12 text-right ${
                  s.impact >= 0 ? 'text-v64-success' : 'text-v64-danger'
                }`}>
                  {s.impact >= 0 ? '+' : ''}{s.impact.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {/* Factor Breakdown */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[7px] text-white/60">금리</div>
                <div className={`text-[10px] font-mono ${impacts.rateImpact >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                  {impacts.rateImpact >= 0 ? '+' : ''}{impacts.rateImpact.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[7px] text-white/60">NASDAQ</div>
                <div className={`text-[10px] font-mono ${impacts.nasdaqImpact >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                  {impacts.nasdaqImpact >= 0 ? '+' : ''}{impacts.nasdaqImpact.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[7px] text-white/60">환율</div>
                <div className={`text-[10px] font-mono ${impacts.krwImpact >= 0 ? 'text-v64-success' : 'text-v64-danger'}`}>
                  {impacts.krwImpact >= 0 ? '+' : ''}{impacts.krwImpact.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[7px] text-white/60">VIX MDD</div>
                <div className="text-[10px] font-mono text-orange-400">
                  {impacts.vixMdd.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Rebalance + Stress Test */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rebalance Compact */}
        <RebalanceCompact />

        {/* Stress Test Compact */}
        <StressTestCompact />
      </div>
    </div>
  );
}
