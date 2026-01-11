'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useNexus } from '@/lib/context';
import { RiskLevel, RiskMetrics } from '@/lib/types';
import { SECTORS, CHART_COLORS } from '@/lib/config';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip);

// ETF별 섹터 분산도 데이터 (실제 ETF 구성 기반)
const ETF_SECTOR_DATA: Record<string, Record<string, number>> = {
  // 고배당/인컴 ETF
  'PLTY': { Technology: 0.25, Finance: 0.20, Healthcare: 0.15, Consumer: 0.15, Energy: 0.10, Industrial: 0.10, Other: 0.05 },
  'HOOY': { Technology: 0.30, Finance: 0.18, Healthcare: 0.12, Consumer: 0.12, Energy: 0.10, Industrial: 0.10, Communication: 0.08 },
  'QYLD': { Technology: 0.50, Communication: 0.15, Consumer: 0.12, Healthcare: 0.10, Finance: 0.08, Other: 0.05 },
  'JEPI': { Technology: 0.20, Healthcare: 0.15, Finance: 0.15, Industrial: 0.12, Consumer: 0.12, Energy: 0.10, Other: 0.16 },
  'JEPQ': { Technology: 0.45, Communication: 0.18, Consumer: 0.15, Healthcare: 0.10, Finance: 0.07, Other: 0.05 },
  'SCHD': { Finance: 0.20, Healthcare: 0.18, Industrial: 0.15, Consumer: 0.15, Technology: 0.12, Energy: 0.10, Other: 0.10 },
  'VIG': { Technology: 0.22, Finance: 0.18, Healthcare: 0.16, Industrial: 0.14, Consumer: 0.14, Communication: 0.06, Materials: 0.05, Other: 0.05 },
  'VYM': { Finance: 0.22, Healthcare: 0.15, Consumer: 0.13, Industrial: 0.12, Energy: 0.10, Technology: 0.10, Utilities: 0.08, Communication: 0.05, Other: 0.05 },

  // 지수 ETF
  'SPY': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'SSO': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'SPYM': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'QQQ': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'DIA': { Finance: 0.22, Healthcare: 0.18, Technology: 0.18, Industrial: 0.15, Consumer: 0.12, Energy: 0.08, Other: 0.07 },
  'IWM': { Healthcare: 0.16, Finance: 0.15, Industrial: 0.15, Technology: 0.14, Consumer: 0.12, RealEstate: 0.08, Energy: 0.08, Other: 0.12 },

  // 섹터 ETF
  'XLK': { Technology: 0.95, Communication: 0.03, Other: 0.02 },
  'XLF': { Finance: 0.95, RealEstate: 0.03, Other: 0.02 },
  'XLE': { Energy: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLV': { Healthcare: 0.95, Consumer: 0.03, Other: 0.02 },

  // 개별주 (섹터 100%)
  'AAPL': { Technology: 1.0 },
  'MSFT': { Technology: 1.0 },
  'GOOGL': { Communication: 1.0 },
  'AMZN': { Consumer: 1.0 },
  'NVDA': { Technology: 1.0 },
  'TSLA': { Consumer: 1.0 },
  'META': { Communication: 1.0 },
  'JPM': { Finance: 1.0 },
  'JNJ': { Healthcare: 1.0 },
  'XOM': { Energy: 1.0 },
};

// 섹터간 상관관계 매트릭스
const SECTOR_CORRELATIONS: Record<string, Record<string, number>> = {
  Technology: { Technology: 1.0, Communication: 0.85, Consumer: 0.70, Healthcare: 0.55, Finance: 0.60, Industrial: 0.65, Energy: 0.30, RealEstate: 0.40, Utilities: 0.25, Materials: 0.50 },
  Communication: { Technology: 0.85, Communication: 1.0, Consumer: 0.75, Healthcare: 0.50, Finance: 0.55, Industrial: 0.60, Energy: 0.25, RealEstate: 0.35, Utilities: 0.20, Materials: 0.45 },
  Consumer: { Technology: 0.70, Communication: 0.75, Consumer: 1.0, Healthcare: 0.60, Finance: 0.65, Industrial: 0.70, Energy: 0.35, RealEstate: 0.50, Utilities: 0.40, Materials: 0.55 },
  Healthcare: { Technology: 0.55, Communication: 0.50, Consumer: 0.60, Healthcare: 1.0, Finance: 0.50, Industrial: 0.55, Energy: 0.30, RealEstate: 0.45, Utilities: 0.50, Materials: 0.45 },
  Finance: { Technology: 0.60, Communication: 0.55, Consumer: 0.65, Healthcare: 0.50, Finance: 1.0, Industrial: 0.70, Energy: 0.55, RealEstate: 0.60, Utilities: 0.35, Materials: 0.60 },
  Industrial: { Technology: 0.65, Communication: 0.60, Consumer: 0.70, Healthcare: 0.55, Finance: 0.70, Industrial: 1.0, Energy: 0.60, RealEstate: 0.55, Utilities: 0.40, Materials: 0.75 },
  Energy: { Technology: 0.30, Communication: 0.25, Consumer: 0.35, Healthcare: 0.30, Finance: 0.55, Industrial: 0.60, Energy: 1.0, RealEstate: 0.35, Utilities: 0.45, Materials: 0.65 },
  RealEstate: { Technology: 0.40, Communication: 0.35, Consumer: 0.50, Healthcare: 0.45, Finance: 0.60, Industrial: 0.55, Energy: 0.35, RealEstate: 1.0, Utilities: 0.60, Materials: 0.50 },
  Utilities: { Technology: 0.25, Communication: 0.20, Consumer: 0.40, Healthcare: 0.50, Finance: 0.35, Industrial: 0.40, Energy: 0.45, RealEstate: 0.60, Utilities: 1.0, Materials: 0.45 },
  Materials: { Technology: 0.50, Communication: 0.45, Consumer: 0.55, Healthcare: 0.45, Finance: 0.60, Industrial: 0.75, Energy: 0.65, RealEstate: 0.50, Utilities: 0.45, Materials: 1.0 },
  ETF: { Technology: 0.70, Communication: 0.65, Consumer: 0.65, Healthcare: 0.55, Finance: 0.60, Industrial: 0.65, Energy: 0.45, RealEstate: 0.50, Utilities: 0.40, Materials: 0.55 },
  Crypto: { Technology: 0.50, Communication: 0.45, Consumer: 0.40, Healthcare: 0.20, Finance: 0.35, Industrial: 0.30, Energy: 0.25, RealEstate: 0.20, Utilities: 0.10, Materials: 0.30 },
  Other: { Technology: 0.50, Communication: 0.50, Consumer: 0.50, Healthcare: 0.50, Finance: 0.50, Industrial: 0.50, Energy: 0.40, RealEstate: 0.45, Utilities: 0.40, Materials: 0.50 },
};

// Risk Score 계산 함수
function calculateRiskMetrics(
  diversificationScore: number,
  topSectorWeight: number,
  vix: number,
  maxAssetWeight: number
): RiskMetrics {
  // VIX 기반 변동성 점수 (VIX 12 = 100점, VIX 40+ = 0점)
  const volatilityScore = Math.max(0, Math.min(100, 100 - (vix - 12) * 3.5));

  // 섹터 집중도 점수 (50% 이상 집중 = 낮은 점수)
  const sectorConcentration = Math.max(0, Math.min(100, 100 - (topSectorWeight * 100)));

  // 단일 종목 집중도 점수 (30% 이상 집중 = 낮은 점수)
  const concentrationRisk = Math.max(0, Math.min(100, 100 - (maxAssetWeight * 100 * 1.5)));

  // 가중 평균 종합 점수
  const overallScore = Math.round(
    diversificationScore * 0.25 +
    sectorConcentration * 0.20 +
    volatilityScore * 0.25 +
    concentrationRisk * 0.30
  );

  return {
    overallScore,
    diversificationScore: Math.round(diversificationScore),
    sectorConcentration: Math.round(sectorConcentration),
    volatilityScore: Math.round(volatilityScore),
    concentrationRisk: Math.round(concentrationRisk),
  };
}

// Risk Level 결정
function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'LOW';
  if (score >= 50) return 'MODERATE';
  if (score >= 30) return 'HIGH';
  return 'EXTREME';
}

// Risk Level 색상
function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    LOW: '#81C784',
    MODERATE: '#FFD700',
    HIGH: '#FFB74D',
    EXTREME: '#E57373',
  };
  return colors[level];
}

// Risk Level 라벨
function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: '안정',
    MODERATE: '보통',
    HIGH: '주의',
    EXTREME: '위험',
  };
  return labels[level];
}

interface AnalyticsProps {
  horizontal?: boolean;
}

export default function Analytics({ horizontal = false }: AnalyticsProps) {
  const { state } = useNexus();
  const { assets, market, exchangeRate } = state;
  const gaugeRef = useRef<HTMLCanvasElement>(null);
  const sectorChartRef = useRef<HTMLCanvasElement>(null);
  const sectorChartInstance = useRef<Chart | null>(null);
  const starCoreChartRef = useRef<HTMLCanvasElement>(null);
  const starCoreChartInstance = useRef<Chart | null>(null);

  // 포트폴리오 섹터 분산도 계산
  const portfolioSectorWeights = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return {};

    const sectorWeights: Record<string, number> = {};

    assets.forEach(asset => {
      const assetWeight = (asset.qty * asset.price) / totalValue;
      const etfSectors = ETF_SECTOR_DATA[asset.ticker];

      if (etfSectors) {
        Object.entries(etfSectors).forEach(([sector, weight]) => {
          sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight * weight;
        });
      } else {
        const sector = asset.sector || 'Other';
        sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight;
      }
    });

    return sectorWeights;
  }, [assets]);

  // 상위 섹터 추출
  const topSectors = useMemo(() => {
    return Object.entries(portfolioSectorWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [portfolioSectorWeights]);

  // 분산도 점수 계산 (HHI 기반)
  const diversificationScore = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    if (weights.length === 0) return 0;

    const hhi = weights.reduce((sum, w) => sum + w * w, 0);
    const minHHI = 1 / Math.max(weights.length, 1);
    const score = Math.max(0, 100 - ((hhi - minHHI) / (1 - minHHI)) * 100);
    return score;
  }, [portfolioSectorWeights]);

  // 시장 지수와의 상관관계 계산
  const marketCorrelations = useMemo(() => {
    const spySectors = ETF_SECTOR_DATA['SPY'] || {};
    const qqqSectors = ETF_SECTOR_DATA['QQQ'] || {};

    let spyCorr = 0;
    let qqqCorr = 0;

    Object.entries(portfolioSectorWeights).forEach(([sector, weight]) => {
      const spyWeight = spySectors[sector] || 0;
      const qqqWeight = qqqSectors[sector] || 0;

      spyCorr += weight * spyWeight * (SECTOR_CORRELATIONS[sector]?.[sector] || 0.5);
      qqqCorr += weight * qqqWeight * (SECTOR_CORRELATIONS[sector]?.[sector] || 0.5);
    });

    spyCorr = Math.min(0.95, Math.max(0.3, spyCorr * 2 + 0.4));
    qqqCorr = Math.min(0.95, Math.max(0.3, qqqCorr * 2 + 0.3));

    return { spy: spyCorr, qqq: qqqCorr };
  }, [portfolioSectorWeights]);

  // 리스크 지표 계산
  const riskProfile = useMemo(() => {
    const techExposure = (portfolioSectorWeights['Technology'] || 0) + (portfolioSectorWeights['Communication'] || 0);
    const defensiveExposure = (portfolioSectorWeights['Healthcare'] || 0) + (portfolioSectorWeights['Utilities'] || 0) + (portfolioSectorWeights['Consumer'] || 0);
    const cyclicalExposure = (portfolioSectorWeights['Finance'] || 0) + (portfolioSectorWeights['Industrial'] || 0) + (portfolioSectorWeights['Energy'] || 0) + (portfolioSectorWeights['Materials'] || 0);

    return { techExposure, defensiveExposure, cyclicalExposure };
  }, [portfolioSectorWeights]);

  // 최대 자산 비중 계산
  const maxAssetWeight = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return 0;

    const weights = assets.map(a => (a.qty * a.price) / totalValue);
    return Math.max(...weights, 0);
  }, [assets]);

  // 최대 섹터 비중
  const topSectorWeight = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    return Math.max(...weights, 0);
  }, [portfolioSectorWeights]);

  // Risk Score 계산
  const riskMetrics = useMemo(() => {
    return calculateRiskMetrics(
      diversificationScore,
      topSectorWeight,
      market.vix || 15,
      maxAssetWeight
    );
  }, [diversificationScore, topSectorWeight, market.vix, maxAssetWeight]);

  const riskLevel = getRiskLevel(riskMetrics.overallScore);
  const riskColor = getRiskColor(riskLevel);

  // Sidebar 기능 통합: Portfolio Weight, Type Distribution, Top/BTM
  const portfolioStats = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + (a.qty * a.price), 0);
    
    // Weight별 정렬
    const assetWeights = assets
      .map(a => ({
        ticker: a.ticker,
        value: a.qty * a.price,
        weight: totalValue > 0 ? (a.qty * a.price / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    // Type 분포 (CORE vs INCOME)
    const coreValue = assets.filter(a => a.type !== 'INCOME').reduce((s, a) => s + a.qty * a.price, 0);
    const incomeValue = assets.filter(a => a.type === 'INCOME').reduce((s, a) => s + a.qty * a.price, 0);

    // Top 3 / Bottom 3
    const sorted = assets
      .map(a => {
        const value = a.qty * a.price;
        const cost = a.qty * a.avg;
        const returnPct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
        return { ticker: a.ticker, returnPct };
      })
      .sort((a, b) => b.returnPct - a.returnPct);

    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    return {
      totalValue,
      assetWeights,
      coreValue,
      incomeValue,
      corePct: totalValue > 0 ? (coreValue / totalValue) * 100 : 0,
      incomePct: totalValue > 0 ? (incomeValue / totalValue) * 100 : 0,
      top3,
      bottom3,
    };
  }, [assets]);

  // Sector Chart 데이터 (Sidebar에서 사용하는 형식)
  const sectorChartData = useMemo(() => {
    const sectorData: { [key: string]: { value: number } } = {};
    assets.forEach(a => {
      const sector = a.sector || 'Other';
      const value = a.qty * a.price;
      if (!sectorData[sector]) {
        sectorData[sector] = { value: 0 };
      }
      sectorData[sector].value += value;
    });

    const sectors = Object.entries(sectorData)
      .map(([name, data]) => ({
        name,
        value: data.value,
        weight: portfolioStats.totalValue > 0 ? (data.value / portfolioStats.totalValue) * 100 : 0,
        emoji: SECTORS[name]?.emoji || '📦',
      }))
      .sort((a, b) => b.weight - a.weight);

    return {
      labels: sectors.map(s => s.name),
      values: sectors.map(s => s.value),
      total: portfolioStats.totalValue,
    };
  }, [assets, portfolioStats.totalValue]);

  // Sector Chart 초기화 및 업데이트
  useEffect(() => {
    if (!sectorChartRef.current) return;

    if (!sectorChartInstance.current) {
      sectorChartInstance.current = new Chart(sectorChartRef.current, {
        type: 'doughnut',
        data: {
          labels: sectorChartData.labels,
          datasets: [{
            data: sectorChartData.values,
            backgroundColor: CHART_COLORS.slice(0, sectorChartData.labels.length),
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(10, 15, 41, 0.9)',
              callbacks: {
                label: (ctx) => {
                  const total = sectorChartData.total || 1;
                  return `${ctx.label}: ${ctx.parsed.toFixed(0)} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
                },
              },
            },
          },
        },
      });
    } else {
      sectorChartInstance.current.data.labels = sectorChartData.labels;
      sectorChartInstance.current.data.datasets[0].data = sectorChartData.values;
      sectorChartInstance.current.data.datasets[0].backgroundColor = CHART_COLORS.slice(0, sectorChartData.labels.length);
      sectorChartInstance.current.update('none');
    }

    return () => {
      if (sectorChartInstance.current) {
        sectorChartInstance.current.destroy();
        sectorChartInstance.current = null;
      }
    };
  }, [sectorChartData]);

  // StarCore 도넛 차트 데이터 및 계산
  const starCoreStats = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    assets.forEach(a => {
      totalValue += a.qty * a.price;
      totalCost += a.qty * a.avg;
    });
    const returnValue = totalValue - totalCost;
    const returnPct = totalCost > 0 ? ((returnValue / totalCost) * 100) : 0;
    return { totalValue, returnValue, returnPct };
  }, [assets]);

  // StarCore 도넛 차트 초기화
  useEffect(() => {
    if (!starCoreChartRef.current) return;

    const data = assets.filter(a => a.qty * a.price > 0);

    if (starCoreChartInstance.current) {
      starCoreChartInstance.current.destroy();
    }

    starCoreChartInstance.current = new Chart(starCoreChartRef.current, {
      type: 'doughnut',
      data: {
        labels: data.map(a => a.ticker),
        datasets: [{
          data: data.map(a => a.qty * a.price),
          backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { animateRotate: false },
      },
    });

    return () => {
      if (starCoreChartInstance.current) {
        starCoreChartInstance.current.destroy();
        starCoreChartInstance.current = null;
      }
    };
  }, [assets]);

  // 반원 게이지 그리기
  useEffect(() => {
    const canvas = gaugeRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height - 15;
    const radius = Math.min(width, height) - 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // 배경 아크 그리기
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 점수 아크 그리기
    const scoreAngle = Math.PI + (riskMetrics.overallScore / 100) * Math.PI;

    // 그라데이션 생성
    const gradient = ctx.createLinearGradient(0, centerY, width, centerY);
    gradient.addColorStop(0, '#E57373');
    gradient.addColorStop(0.3, '#FFB74D');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#81C784');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, scoreAngle);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 20;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 점수 텍스트
    ctx.font = 'bold 36px "Cinzel", serif';
    ctx.fillStyle = riskColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(riskMetrics.overallScore.toString(), centerX, centerY - 30);

    // 레벨 텍스트
    ctx.font = '13px "Montserrat", sans-serif';
    ctx.fillStyle = riskColor;
    ctx.fillText(getRiskLabel(riskLevel), centerX, centerY + 8);

  }, [riskMetrics.overallScore, riskColor, riskLevel]);

  const getSectorIcon = (sector: string) => {
    const icons: Record<string, string> = {
      Technology: '💻', Communication: '📡', Consumer: '🛒', Healthcare: '🏥',
      Finance: '🏦', Industrial: '🏭', Energy: '⚡', RealEstate: '🏠',
      Utilities: '💡', Materials: '🧱', ETF: '📊', Crypto: '₿', Other: '📦'
    };
    return icons[sector] || '📦';
  };

  if (assets.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
          <i className="fas fa-shield-alt text-celestial-cyan" />
          <h3 className="font-display text-sm tracking-widest text-white/90">ANALYTICS</h3>
        </div>
        <div className="text-center py-8 opacity-50">
          <i className="fas fa-chart-pie text-2xl mb-3 opacity-30" />
          <div className="text-[10px]">자산을 추가하세요</div>
        </div>
      </div>
    );
  }

  // 가로 레이아웃
  if (horizontal) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
          <i className="fas fa-shield-alt text-celestial-cyan" />
          <h3 className="font-display text-lg tracking-widest text-white">ANALYTICS</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {/* Column 1: TOTAL VALUE + INSIGHT */}
          <div className="flex flex-col gap-3">
            <div className="inner-glass p-4 rounded-lg flex flex-col items-center justify-center relative min-h-[200px]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <div style={{ width: 130, height: 130 }}>
                  <canvas ref={starCoreChartRef} />
                </div>
              </div>
              <div className="relative z-10 text-center">
                <div className="text-[9px] tracking-widest text-white/80 mb-1.5">TOTAL VALUE</div>
                <div className="text-xl font-display font-light text-white">
                  ${(starCoreStats.totalValue / 1000).toFixed(0)}K
                </div>
                <div className={`text-xs font-light mt-1 ${
                  starCoreStats.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'
                }`}>
                  {starCoreStats.returnPct >= 0 ? '+' : ''}{starCoreStats.returnPct.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="inner-glass p-3 rounded-lg border border-celestial-purple/30 flex flex-col min-h-[200px]">
              <div className="text-[10px] text-celestial-purple tracking-widest mb-2">
                <i className="fas fa-lightbulb mr-1" />
                INSIGHT
              </div>
              <div className="text-[10px] text-white/90 leading-relaxed flex-1">
                {riskMetrics.overallScore >= 70 ? (
                  <>포트폴리오가 <span className="text-v64-success">안정적</span>으로 분산되어 있습니다. 현재 전략을 유지하세요.</>
                ) : riskMetrics.overallScore >= 50 ? (
                  <>전반적으로 <span className="text-celestial-gold">양호</span>하지만, 일부 섹터 집중도를 점검하세요.</>
                ) : riskMetrics.overallScore >= 30 ? (
                  <>리스크가 <span className="text-v64-warning">높은 편</span>입니다. 분산 투자를 고려하세요.</>
                ) : (
                  <>리스크가 <span className="text-v64-danger">매우 높습니다</span>. 포트폴리오 재조정을 권장합니다.</>
                )}
                {market.vix > 25 && (
                  <> 현재 VIX({market.vix?.toFixed(1)})가 높아 시장 변동성에 주의가 필요합니다.</>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: RISK SCORE + RISK FACTORS */}
          <div className="flex flex-col gap-3">
            <div className="inner-glass p-3 rounded-lg flex flex-col items-center justify-center min-h-[200px]">
              <div className="text-[10px] tracking-widest text-white/80 mb-2">RISK SCORE</div>
              <canvas
                ref={gaugeRef}
                width={180}
                height={120}
                className="max-w-full"
              />
            </div>
            <div className="inner-glass p-3 rounded-lg flex flex-col min-h-[200px]">
              <div className="text-[10px] tracking-widest text-white/90 mb-3">RISK FACTORS</div>
              <div className="space-y-2 flex-1">
                {[
                  { label: '분산도', score: riskMetrics.diversificationScore, icon: 'chart-pie' },
                  { label: '섹터 집중', score: riskMetrics.sectorConcentration, icon: 'layer-group' },
                  { label: '변동성', score: riskMetrics.volatilityScore, icon: 'chart-line' },
                  { label: '종목 집중', score: riskMetrics.concentrationRisk, icon: 'bullseye' },
                ].map(factor => (
                  <div key={factor.label} className="inner-glass p-2 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-white/80">
                        <i className={`fas fa-${factor.icon} mr-1`} />
                        {factor.label}
                      </span>
                      <span className={`text-[10px] font-mono ${
                        factor.score >= 70 ? 'text-v64-success' :
                        factor.score >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
                      }`}>
                        {factor.score}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          factor.score >= 70 ? 'bg-v64-success' :
                          factor.score >= 40 ? 'bg-celestial-gold' : 'bg-v64-danger'
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: WEIGHT + SECTOR */}
          <div className="flex flex-col gap-3">
            <div className="inner-glass p-3 rounded-lg flex flex-col min-h-[200px]">
              <div className="text-[10px] tracking-widest text-white/90 mb-2 flex items-center justify-between">
                <span>WEIGHT</span>
                <span className="text-[9px] text-white/60">{portfolioStats.assetWeights.length}</span>
              </div>
              <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
                {portfolioStats.assetWeights.slice(0, 6).map((item, i) => (
                  <div key={item.ticker} className="flex items-center gap-1.5">
                    <span className="text-[10px] w-10 truncate text-white/90">{item.ticker}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.weight}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-[9px] w-8 text-right text-white/80">
                      {item.weight.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="inner-glass p-3 rounded-lg flex flex-col min-h-[200px]">
              <div className="text-[10px] text-white/90 tracking-widest mb-2 flex items-center gap-1">
                <i className="fas fa-chart-pie text-celestial-purple text-[9px]" /> SECTOR
              </div>
              <div className="flex gap-2 flex-1 items-center">
                <div style={{ width: 70, height: 70 }} className="flex-shrink-0">
                  <canvas ref={sectorChartRef} />
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar text-[9px]">
                  {topSectors.slice(0, 5).map(([sector, weight], i) => (
                    <div key={sector} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-white/90 truncate">{getSectorIcon(sector)}</span>
                      </div>
                      <span className="text-white/80">{(weight * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: TYPE + TOP */}
          <div className="flex flex-col gap-3">
            <div className="inner-glass p-3 rounded-lg flex flex-col min-h-[200px]">
              <div className="text-[10px] tracking-widest text-white/90 mb-2">TYPE</div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="inner-glass p-2 text-center rounded border border-white/10 flex flex-col justify-center">
                  <div className="text-[8px] text-white/80 tracking-widest">CORE</div>
                  <div className="text-sm font-display text-white">
                    ${(portfolioStats.coreValue / 1000).toFixed(0)}K
                  </div>
                  <div className="text-[9px] text-white/80">{portfolioStats.corePct.toFixed(0)}%</div>
                </div>
                <div className="inner-glass p-2 text-center rounded border border-celestial-gold/30 flex flex-col justify-center">
                  <div className="text-[8px] text-celestial-gold/90 tracking-widest">INCOME</div>
                  <div className="text-sm font-display text-celestial-gold">
                    ${(portfolioStats.incomeValue / 1000).toFixed(0)}K
                  </div>
                  <div className="text-[9px] text-celestial-gold">{portfolioStats.incomePct.toFixed(0)}%</div>
                </div>
              </div>
            </div>
            <div className="inner-glass p-3 rounded-lg flex flex-col min-h-[200px]">
              <div className="ranking-title text-[10px] mb-2 text-white/90">
                <i className="fas fa-trophy text-celestial-gold text-[9px]" /> TOP
              </div>
              <div className="space-y-1.5 flex-1">
                {portfolioStats.top3.slice(0, 3).map((item) => (
                  <div key={item.ticker} className="ranking-item flex justify-between text-[10px]">
                    <span className="truncate text-white/90">{item.ticker}</span>
                    <span className="text-v64-success">{item.returnPct >= 0 ? '+' : ''}{item.returnPct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 5: BTM + VS S&P 500 + VS NASDAQ + RISK PROFILE */}
          <div className="flex flex-col gap-3">
            <div className="inner-glass p-3 rounded-lg flex flex-col min-h-[200px]">
              <div className="ranking-title text-[10px] mb-2 text-white/90">
                <i className="fas fa-exclamation-triangle text-v64-danger text-[9px]" /> BTM
              </div>
              <div className="space-y-1.5 flex-1">
                {portfolioStats.bottom3.slice(0, 3).map((item) => (
                  <div key={item.ticker} className="ranking-item flex justify-between text-[10px]">
                    <span className="truncate text-white/90">{item.ticker}</span>
                    <span className={item.returnPct >= 0 ? 'text-v64-success' : 'text-v64-danger'}>
                      {item.returnPct >= 0 ? '+' : ''}{item.returnPct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="inner-glass p-3 rounded-lg flex flex-col justify-center min-h-[200px]">
              <div className="text-[10px] text-white/80 tracking-widest mb-2 flex items-center gap-1">
                <i className="fas fa-chart-line text-v64-danger text-[9px]" /> VS S&P 500
              </div>
              <div className={`text-2xl font-display mb-2 ${
                marketCorrelations.spy >= 0.7 ? 'text-v64-success' : 'text-celestial-gold'
              }`}>
                {marketCorrelations.spy.toFixed(2)}
              </div>
              {portfolioStats.bottom3.length > 0 && (
                <div className="text-[9px] text-v64-danger mt-1">
                  {portfolioStats.bottom3[0]?.ticker} {portfolioStats.bottom3[0]?.returnPct < 0 ? '' : '+'}{portfolioStats.bottom3[0]?.returnPct.toFixed(0)}%
                </div>
              )}
            </div>
            <div className="inner-glass p-3 rounded-lg flex flex-col justify-center min-h-[200px]">
              <div className="text-[10px] text-white/80 tracking-widest mb-2">VS NASDAQ</div>
              <div className={`text-2xl font-display ${
                marketCorrelations.qqq >= 0.7 ? 'text-v64-success' : 'text-celestial-gold'
              }`}>
                {marketCorrelations.qqq.toFixed(2)}
              </div>
            </div>
            <div className="inner-glass p-3 rounded-lg flex flex-col justify-center min-h-[200px]">
              <div className="text-[10px] text-white/80 tracking-widest mb-3">RISK PROFILE</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[12px] text-blue-400 font-mono mb-0.5">{(riskProfile.techExposure * 100).toFixed(0)}%</div>
                  <div className="text-[9px] text-white/80">Tech</div>
                </div>
                <div>
                  <div className="text-[12px] text-v64-success font-mono mb-0.5">{(riskProfile.defensiveExposure * 100).toFixed(0)}%</div>
                  <div className="text-[9px] text-white/80">방어</div>
                </div>
                <div>
                  <div className="text-[12px] text-celestial-gold font-mono mb-0.5">{(riskProfile.cyclicalExposure * 100).toFixed(0)}%</div>
                  <div className="text-[9px] text-white/80">경기</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 세로 레이아웃 (기존)
  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3 flex-shrink-0">
        <i className="fas fa-shield-alt text-celestial-cyan" />
        <h3 className="font-display text-sm tracking-widest text-white/90">RISK ANALYTICS</h3>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {/* Risk Score Gauge */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={gaugeRef}
            width={200}
            height={120}
            className="max-w-full"
          />
        </div>

        {/* Risk Factors */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: '분산도', score: riskMetrics.diversificationScore, icon: 'chart-pie' },
            { label: '섹터 집중', score: riskMetrics.sectorConcentration, icon: 'layer-group' },
            { label: '변동성', score: riskMetrics.volatilityScore, icon: 'chart-line' },
            { label: '종목 집중', score: riskMetrics.concentrationRisk, icon: 'bullseye' },
          ].map(factor => (
            <div key={factor.label} className="inner-glass p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] opacity-50">
                  <i className={`fas fa-${factor.icon} mr-1`} />
                  {factor.label}
                </span>
                <span className={`text-[10px] font-mono ${
                  factor.score >= 70 ? 'text-v64-success' :
                  factor.score >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
                }`}>
                  {factor.score}
                </span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    factor.score >= 70 ? 'bg-v64-success' :
                    factor.score >= 40 ? 'bg-celestial-gold' : 'bg-v64-danger'
                  }`}
                  style={{ width: `${factor.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Sector Exposure */}
        <div className="inner-glass p-3 rounded-lg mb-3">
          <div className="text-[9px] opacity-40 tracking-widest mb-2">SECTOR EXPOSURE</div>
          <div className="space-y-2">
            {topSectors.map(([sector, weight]) => (
              <div key={sector} className="flex items-center gap-2">
                <span className="text-[11px] w-5">{getSectorIcon(sector)}</span>
                <span className="text-[9px] opacity-70 w-20 truncate">{sector}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-celestial-cyan/50 to-celestial-cyan rounded-full"
                    style={{ width: `${weight * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono w-10 text-right">{(weight * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Correlation */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="inner-glass p-3 rounded-lg text-center">
            <div className="text-[8px] opacity-40 tracking-widest mb-1">VS S&P 500</div>
            <div className={`text-base font-display ${
              marketCorrelations.spy >= 0.7 ? 'text-v64-success' : 'text-celestial-gold'
            }`}>
              {marketCorrelations.spy.toFixed(2)}
            </div>
            <div className="text-[7px] opacity-40">상관계수</div>
          </div>
          <div className="inner-glass p-3 rounded-lg text-center">
            <div className="text-[8px] opacity-40 tracking-widest mb-1">VS NASDAQ</div>
            <div className={`text-base font-display ${
              marketCorrelations.qqq >= 0.7 ? 'text-v64-success' : 'text-celestial-gold'
            }`}>
              {marketCorrelations.qqq.toFixed(2)}
            </div>
            <div className="text-[7px] opacity-40">상관계수</div>
          </div>
        </div>

        {/* Risk Profile */}
        <div className="inner-glass p-3 rounded-lg mb-3">
          <div className="text-[9px] opacity-40 tracking-widest mb-2">RISK PROFILE</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-blue-400 font-mono">{(riskProfile.techExposure * 100).toFixed(0)}%</div>
              <div className="text-[7px] opacity-40">Tech/성장</div>
            </div>
            <div>
              <div className="text-[10px] text-v64-success font-mono">{(riskProfile.defensiveExposure * 100).toFixed(0)}%</div>
              <div className="text-[7px] opacity-40">방어주</div>
            </div>
            <div>
              <div className="text-[10px] text-celestial-gold font-mono">{(riskProfile.cyclicalExposure * 100).toFixed(0)}%</div>
              <div className="text-[7px] opacity-40">경기민감</div>
            </div>
          </div>
        </div>

        {/* Insight */}
        <div className="inner-glass p-3 rounded-lg border border-celestial-purple/20">
          <div className="text-[9px] text-celestial-purple tracking-widest mb-1">
            <i className="fas fa-lightbulb mr-1" />
            INSIGHT
          </div>
          <div className="text-[9px] text-white/70 leading-relaxed">
            {riskMetrics.overallScore >= 70 ? (
              <>포트폴리오가 <span className="text-v64-success">안정적</span>으로 분산되어 있습니다. 현재 전략을 유지하세요.</>
            ) : riskMetrics.overallScore >= 50 ? (
              <>전반적으로 <span className="text-celestial-gold">양호</span>하지만, 일부 섹터 집중도를 점검하세요.</>
            ) : riskMetrics.overallScore >= 30 ? (
              <>리스크가 <span className="text-v64-warning">높은 편</span>입니다. 분산 투자를 고려하세요.</>
            ) : (
              <>리스크가 <span className="text-v64-danger">매우 높습니다</span>. 포트폴리오 재조정을 권장합니다.</>
            )}
            {market.vix > 25 && (
              <> 현재 VIX({market.vix?.toFixed(1)})가 높아 시장 변동성에 주의가 필요합니다.</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
