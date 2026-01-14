'use client';

import { useRef, useEffect } from 'react';
import { useNexus } from '@/lib/context';
import { CHART_COLORS } from '@/lib/config';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';
import { useRiskAnalytics, getRiskLabel } from '@/lib/hooks/useRiskAnalytics';

Chart.register(DoughnutController, ArcElement, Tooltip);

interface AnalyticsProps {
  horizontal?: boolean;
}

export default function Analytics({ horizontal = false }: AnalyticsProps) {
  const { state } = useNexus();
  const { assets, market } = state;
  const gaugeRef = useRef<HTMLCanvasElement>(null);
  const totalValueChartRef = useRef<HTMLCanvasElement>(null);
  const totalValueChartInstance = useRef<Chart | null>(null);
  const sectorChartRef = useRef<HTMLCanvasElement>(null);
  const sectorChartInstance = useRef<Chart | null>(null);
  const typeChartRef = useRef<HTMLCanvasElement>(null);
  const typeChartInstance = useRef<Chart | null>(null);

  const {
    riskMetrics,
    riskLevel,
    riskColor,
    riskProfile,
    marketCorrelations,
    topSectors,
    portfolioStats,
    maxAssetWeight
  } = useRiskAnalytics(assets, market);

  // 모든 도넛 차트 통합 렌더링 (성능 최적화)
  useEffect(() => {
    // 공통 차트 옵션
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      animation: { animateRotate: false },
    };

    // Total Value 차트
    if (totalValueChartRef.current) {
      if (totalValueChartInstance.current) totalValueChartInstance.current.destroy();
      const data = assets.filter(a => a.qty * a.price > 0);
      totalValueChartInstance.current = new Chart(totalValueChartRef.current, {
        type: 'doughnut',
        data: {
          labels: data.map(a => a.ticker),
          datasets: [{
            data: data.map(a => a.qty * a.price),
            backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderWidth: 0,
          }],
        },
        options: { ...commonOptions, cutout: '75%' },
      });
    }

    // Sector 차트
    if (sectorChartRef.current) {
      if (sectorChartInstance.current) sectorChartInstance.current.destroy();
      sectorChartInstance.current = new Chart(sectorChartRef.current, {
        type: 'doughnut',
        data: {
          labels: topSectors.map(([s]) => s),
          datasets: [{
            data: topSectors.map(([, w]) => w * 100),
            backgroundColor: CHART_COLORS.slice(0, topSectors.length),
            borderWidth: 0,
          }],
        },
        options: { ...commonOptions, cutout: '65%' },
      });
    }

    // Type 차트
    if (typeChartRef.current) {
      if (typeChartInstance.current) typeChartInstance.current.destroy();
      typeChartInstance.current = new Chart(typeChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['CORE', 'INCOME'],
          datasets: [{
            data: [portfolioStats.corePct, portfolioStats.incomePct],
            backgroundColor: ['#64B5F6', '#FFD700'],
            borderWidth: 0,
          }],
        },
        options: { ...commonOptions, cutout: '65%' },
      });
    }

    return () => {
      totalValueChartInstance.current?.destroy();
      sectorChartInstance.current?.destroy();
      typeChartInstance.current?.destroy();
      totalValueChartInstance.current = null;
      sectorChartInstance.current = null;
      typeChartInstance.current = null;
    };
  }, [assets, topSectors, portfolioStats.corePct, portfolioStats.incomePct]);

  // 반원 게이지 그리기
  useEffect(() => {
    const canvas = gaugeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 20;
    const radius = Math.min(width / 2, height) - 30;

    ctx.clearRect(0, 0, width, height);

    // 배경 아크
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 그라데이션 아크
    const gradient = ctx.createLinearGradient(0, centerY, width, centerY);
    gradient.addColorStop(0, '#E57373');
    gradient.addColorStop(0.35, '#FFB74D');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#81C784');

    const scoreAngle = Math.PI + (riskMetrics.overallScore / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, scoreAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

  }, [riskMetrics.overallScore]);

  if (assets.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="text-center py-12 opacity-50">
          <i className="fas fa-chart-pie text-4xl mb-4 opacity-30" />
          <div className="text-sm">자산을 추가하세요</div>
        </div>
      </div>
    );
  }

  // 가로 레이아웃 (3행 x 4열 그리드)
  if (horizontal) {
    return (
      <div className="glass-card p-3 md:p-4 lg:p-5">
        {/* Row 1: Total Value, Weight, Sector, Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Total Value */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3 flex items-center gap-2">
              총 평가액 <i className="fas fa-info-circle text-white/30" />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 100, height: 100 }}>
                <canvas ref={totalValueChartRef} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-display text-white">
                    ${(portfolioStats.totalValue / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {portfolioStats.assetWeights.slice(0, 5).map((item, i) => (
                  <div key={item.ticker} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-white/80 w-16">{item.ticker}</span>
                    <span className="text-white/60">{item.weight.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weight */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3">비중</div>
            <div className="space-y-2">
              {portfolioStats.assetWeights.slice(0, 5).map((item, i) => (
                <div key={item.ticker} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-xs text-white/80 w-20">{item.ticker}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.weight}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs text-white/60 w-14 text-right">{item.weight.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sector */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3">섹터</div>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 80, height: 80 }}>
                <canvas ref={sectorChartRef} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-white/60">topSectors</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                {topSectors.map(([sector, weight], i) => (
                  <div key={sector} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-white/80">{sector}</span>
                    <span className="text-white/60 ml-auto">{(weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Type */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3">유형</div>
            <div className="flex items-center gap-4">
              <div className="relative" style={{ width: 80, height: 80 }}>
                <canvas ref={typeChartRef} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-white/60">Assets</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-white/80">CORE</span>
                  <span className="text-xs text-blue-400 ml-auto">{portfolioStats.corePct.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-celestial-gold" />
                  <span className="text-xs text-white/80">INCOME</span>
                  <span className="text-xs text-celestial-gold ml-auto">{portfolioStats.incomePct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Risk Score, Risk Factors, Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
          {/* Risk Score */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-2">리스크 점수</div>
            <div className="flex flex-col items-center">
              <canvas ref={gaugeRef} width={180} height={100} />
              <div className="text-center -mt-2">
                <div className="text-3xl font-display" style={{ color: riskColor }}>
                  {riskMetrics.overallScore}
                </div>
                <div className="text-xs tracking-wider" style={{ color: riskColor }}>
                  {getRiskLabel(riskLevel)}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="inner-glass p-4 rounded-xl col-span-2">
            <div className="text-xs tracking-widest text-white/60 mb-3">리스크 요인</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: '분산도', eng: 'Diversification', score: riskMetrics.diversificationScore },
                { label: '섹터 집중', eng: 'Sector Concentration', score: riskMetrics.sectorConcentration },
                { label: '변동성', eng: 'Volatility', score: riskMetrics.volatilityScore },
                { label: '종목 집중', eng: 'Stock Concentration', score: riskMetrics.concentrationRisk },
              ].map(factor => (
                <div key={factor.label}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-4 rounded-sm ${
                            i < Math.ceil(factor.score / 20)
                              ? factor.score >= 70 ? 'bg-v64-success' : factor.score >= 40 ? 'bg-celestial-gold' : 'bg-v64-danger'
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-mono ${
                      factor.score >= 70 ? 'text-v64-success' : factor.score >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
                    }`}>
                      {factor.score}
                    </span>
                  </div>
                  <div className="text-xs text-white/60">
                    {factor.label} <span className="text-white/40">({factor.eng})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3">수익률</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/60 mb-2">상위</div>
                {portfolioStats.top3.map(item => (
                  <div key={item.ticker} className="flex justify-between text-xs mb-1">
                    <span className="text-white/80">{item.ticker}</span>
                    <span className="text-v64-success">+{item.returnPct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs text-white/60 mb-2">하위</div>
                {portfolioStats.bottom3.map(item => (
                  <div key={item.ticker} className="flex justify-between text-xs mb-1">
                    <span className="text-white/80">{item.ticker}</span>
                    <span className={item.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                      {item.returnPct >= 0 ? '+' : ''}{item.returnPct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Market Correlation, Risk Profile, Insight */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Market Correlation */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3">시장 상관관계</div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-white/50 mb-1">VS S&P 500</div>
                <div className="text-2xl font-display text-white/90">({marketCorrelations.spy.toFixed(2)})</div>
              </div>
              <div>
                <div className="text-xs text-white/50 mb-1">VS NASDAQ</div>
                <div className="text-2xl font-display text-white/90">({marketCorrelations.qqq.toFixed(2)})</div>
              </div>
            </div>
          </div>

          {/* Risk Profile */}
          <div className="inner-glass p-4 rounded-xl">
            <div className="text-xs tracking-widest text-white/60 mb-3">리스크 프로필</div>
            <div className="text-xs text-white/60 mb-3">포트폴리오 구성 분석 기반:</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs">
                Tech (기술주)
              </span>
              <span className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/50 text-green-400 text-xs">
                방어 (Defensive)
              </span>
              <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs">
                경기 (Cyclical)
              </span>
            </div>
          </div>

          {/* Insight */}
          <div className="inner-glass p-4 rounded-xl md:col-span-2">
            <div className="text-xs tracking-widest text-white/60 mb-3">인사이트</div>
            <ul className="text-xs text-white/80 space-y-2 list-disc list-inside">
              {riskProfile.defensiveExposure < 0.2 && (
                <li>변동성을 낮추기 위해 방어 자산 비중을 늘리는 것을 고려하세요.</li>
              )}
              {riskProfile.techExposure > 0.4 && (
                <li>기술주 섹터 비중이 높습니다. 분산도를 재검토하세요.</li>
              )}
              {maxAssetWeight > 0.2 && portfolioStats.top3[0] && (
                <li>{portfolioStats.top3[0].ticker}의 집중도를 모니터링하세요.</li>
              )}
              {riskMetrics.overallScore >= 70 && (
                <li>포트폴리오가 잘 분산되어 있습니다. 현재 전략을 유지하세요.</li>
              )}
              {market.vix > 25 && (
                <li>VIX가 상승({market.vix?.toFixed(1)})했습니다. 시장 변동성을 주시하세요.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 세로 레이아웃 (기존 유지)
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
        <i className="fas fa-shield-alt text-celestial-cyan" />
        <h3 className="font-display text-sm tracking-widest text-white/90">ANALYTICS</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        <div className="flex justify-center mb-4">
          <canvas ref={gaugeRef} width={200} height={120} />
        </div>
        <div className="text-center mb-4">
          <div className="text-2xl font-display" style={{ color: riskColor }}>
            {riskMetrics.overallScore}
          </div>
          <div className="text-xs" style={{ color: riskColor }}>
            {getRiskLabel(riskLevel)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: '분산도', score: riskMetrics.diversificationScore },
            { label: '섹터 집중', score: riskMetrics.sectorConcentration },
            { label: '변동성', score: riskMetrics.volatilityScore },
            { label: '종목 집중', score: riskMetrics.concentrationRisk },
          ].map(factor => (
            <div key={factor.label} className="inner-glass p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-white/60">{factor.label}</span>
                <span className={`text-xs font-mono ${
                  factor.score >= 70 ? 'text-v64-success' : factor.score >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
                }`}>
                  {factor.score}
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    factor.score >= 70 ? 'bg-v64-success' : factor.score >= 40 ? 'bg-celestial-gold' : 'bg-v64-danger'
                  }`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}