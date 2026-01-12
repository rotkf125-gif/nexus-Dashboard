'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useNexus } from '@/lib/context';
import { RiskLevel, RiskMetrics } from '@/lib/types';
import { SECTORS, CHART_COLORS } from '@/lib/config';
import { Chart, DoughnutController, ArcElement, Tooltip } from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip);

// ═══════════════════════════════════════════════════════════════
// ETF별 섹터 분산도 데이터 (실제 ETF 구성 기반)
//
// 주의: 이 데이터는 하드코딩되어 있어 시장 변화 반영이 안됩니다.
// - 개별 주식: /api/info API를 통해 자동으로 섹터 조회 가능
// - ETF: 구성 종목이 복잡하므로 수동 관리 필요
//
// 새 ETF 추가 시: 해당 ETF의 실제 섹터 비중을 조사하여 추가
// 비중 합계는 반드시 1.0 (100%)이 되어야 합니다.
// ═══════════════════════════════════════════════════════════════
const ETF_SECTOR_DATA: Record<string, Record<string, number>> = {
  // === 주간 배당 ETF (Income ETFs) ===
  'PLTY': { Technology: 0.25, Finance: 0.20, Healthcare: 0.15, Consumer: 0.15, Energy: 0.10, Industrial: 0.10, Other: 0.05 },
  'HOOY': { Technology: 0.30, Finance: 0.18, Healthcare: 0.12, Consumer: 0.12, Energy: 0.10, Industrial: 0.10, Communication: 0.08 },
  'QYLD': { Technology: 0.50, Communication: 0.15, Consumer: 0.12, Healthcare: 0.10, Finance: 0.08, Other: 0.05 },
  'QDTE': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 }, // NASDAQ-100 0DTE Covered Call
  'XYLD': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'RYLD': { Healthcare: 0.16, Finance: 0.15, Industrial: 0.15, Technology: 0.14, Consumer: 0.12, RealEstate: 0.08, Energy: 0.08, Other: 0.12 },

  // === JP Morgan 배당 ETF ===
  'JEPI': { Technology: 0.20, Healthcare: 0.15, Finance: 0.15, Industrial: 0.12, Consumer: 0.12, Energy: 0.10, Other: 0.16 },
  'JEPQ': { Technology: 0.45, Communication: 0.18, Consumer: 0.15, Healthcare: 0.10, Finance: 0.07, Other: 0.05 },

  // === 배당 성장 ETF ===
  'SCHD': { Finance: 0.20, Healthcare: 0.18, Industrial: 0.15, Consumer: 0.15, Technology: 0.12, Energy: 0.10, Other: 0.10 },
  'VIG': { Technology: 0.22, Finance: 0.18, Healthcare: 0.16, Industrial: 0.14, Consumer: 0.14, Communication: 0.06, Materials: 0.05, Other: 0.05 },
  'VYM': { Finance: 0.22, Healthcare: 0.15, Consumer: 0.13, Industrial: 0.12, Energy: 0.10, Technology: 0.10, Utilities: 0.08, Communication: 0.05, Other: 0.05 },
  'SPYD': { RealEstate: 0.20, Utilities: 0.18, Finance: 0.15, Energy: 0.12, Healthcare: 0.10, Consumer: 0.10, Industrial: 0.08, Other: 0.07 },
  'HDV': { Healthcare: 0.22, Energy: 0.20, Consumer: 0.15, Communication: 0.12, Utilities: 0.10, Finance: 0.10, Technology: 0.06, Other: 0.05 },
  'DIVO': { Technology: 0.18, Healthcare: 0.16, Finance: 0.15, Consumer: 0.14, Industrial: 0.12, Communication: 0.10, Energy: 0.08, Other: 0.07 },

  // === 주요 지수 ETF ===
  'SPY': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'VOO': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'IVV': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'SSO': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'SPYM': { Technology: 0.30, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Communication: 0.09, Industrial: 0.08, Energy: 0.05, Other: 0.10 },
  'QQQ': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'QQQM': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'TQQQ': { Technology: 0.50, Communication: 0.16, Consumer: 0.14, Healthcare: 0.07, Industrial: 0.05, Finance: 0.03, Other: 0.05 },
  'DIA': { Finance: 0.22, Healthcare: 0.18, Technology: 0.18, Industrial: 0.15, Consumer: 0.12, Energy: 0.08, Other: 0.07 },
  'IWM': { Healthcare: 0.16, Finance: 0.15, Industrial: 0.15, Technology: 0.14, Consumer: 0.12, RealEstate: 0.08, Energy: 0.08, Other: 0.12 },
  'VTI': { Technology: 0.28, Healthcare: 0.13, Finance: 0.13, Consumer: 0.12, Industrial: 0.10, Communication: 0.08, Energy: 0.05, Other: 0.11 },

  // === 섹터 ETF ===
  'XLK': { Technology: 0.95, Communication: 0.03, Other: 0.02 },
  'XLF': { Finance: 0.95, RealEstate: 0.03, Other: 0.02 },
  'XLE': { Energy: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLV': { Healthcare: 0.95, Consumer: 0.03, Other: 0.02 },
  'XLY': { Consumer: 0.95, Communication: 0.03, Other: 0.02 },
  'XLI': { Industrial: 0.95, Materials: 0.03, Other: 0.02 },
  'XLP': { Consumer: 0.95, Healthcare: 0.03, Other: 0.02 },
  'XLU': { Utilities: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLRE': { RealEstate: 0.95, Finance: 0.03, Other: 0.02 },
  'XLB': { Materials: 0.95, Industrial: 0.03, Other: 0.02 },
  'XLC': { Communication: 0.95, Technology: 0.03, Other: 0.02 },

  // === 개별 주식 (Big Tech & 주요 종목) ===
  'AAPL': { Technology: 1.0 },
  'MSFT': { Technology: 1.0 },
  'GOOGL': { Communication: 1.0 },
  'GOOG': { Communication: 1.0 },
  'AMZN': { Consumer: 1.0 },
  'NVDA': { Technology: 1.0 },
  'TSLA': { Consumer: 1.0 },
  'META': { Communication: 1.0 },
  'AVGO': { Technology: 1.0 },
  'AMD': { Technology: 1.0 },
  'INTC': { Technology: 1.0 },
  'CRM': { Technology: 1.0 },
  'ORCL': { Technology: 1.0 },
  'ADBE': { Technology: 1.0 },

  // === 금융 ===
  'JPM': { Finance: 1.0 },
  'BAC': { Finance: 1.0 },
  'WFC': { Finance: 1.0 },
  'GS': { Finance: 1.0 },
  'MS': { Finance: 1.0 },
  'V': { Finance: 1.0 },
  'MA': { Finance: 1.0 },

  // === 헬스케어 ===
  'JNJ': { Healthcare: 1.0 },
  'UNH': { Healthcare: 1.0 },
  'PFE': { Healthcare: 1.0 },
  'MRK': { Healthcare: 1.0 },
  'ABBV': { Healthcare: 1.0 },
  'LLY': { Healthcare: 1.0 },

  // === 에너지 ===
  'XOM': { Energy: 1.0 },
  'CVX': { Energy: 1.0 },
  'COP': { Energy: 1.0 },

  // === 소비재/통신 ===
  'KO': { Consumer: 1.0 },
  'PEP': { Consumer: 1.0 },
  'WMT': { Consumer: 1.0 },
  'COST': { Consumer: 1.0 },
  'HD': { Consumer: 1.0 },
  'MCD': { Consumer: 1.0 },
  'DIS': { Communication: 1.0 },
  'NFLX': { Communication: 1.0 },
  'T': { Communication: 1.0 },
  'VZ': { Communication: 1.0 },

  // === 산업재 ===
  'CAT': { Industrial: 1.0 },
  'BA': { Industrial: 1.0 },
  'HON': { Industrial: 1.0 },
  'UPS': { Industrial: 1.0 },
  'UNP': { Industrial: 1.0 },
};

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

function calculateRiskMetrics(
  diversificationScore: number,
  topSectorWeight: number,
  vix: number,
  maxAssetWeight: number
): RiskMetrics {
  const volatilityScore = Math.max(0, Math.min(100, 100 - (vix - 12) * 3.5));
  const sectorConcentration = Math.max(0, Math.min(100, 100 - (topSectorWeight * 100)));
  const concentrationRisk = Math.max(0, Math.min(100, 100 - (maxAssetWeight * 100 * 1.5)));
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

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'LOW';
  if (score >= 50) return 'MODERATE';
  if (score >= 30) return 'HIGH';
  return 'EXTREME';
}

function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    LOW: '#81C784',
    MODERATE: '#FFD700',
    HIGH: '#FFB74D',
    EXTREME: '#E57373',
  };
  return colors[level];
}

function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: 'LOW RISK',
    MODERATE: 'MODERATE RISK',
    HIGH: 'HIGH RISK',
    EXTREME: 'EXTREME RISK',
  };
  return labels[level];
}

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

  const topSectors = useMemo(() => {
    return Object.entries(portfolioSectorWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [portfolioSectorWeights]);

  const diversificationScore = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    if (weights.length === 0) return 0;
    const hhi = weights.reduce((sum, w) => sum + w * w, 0);
    const minHHI = 1 / Math.max(weights.length, 1);
    return Math.max(0, 100 - ((hhi - minHHI) / (1 - minHHI)) * 100);
  }, [portfolioSectorWeights]);

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

  const riskProfile = useMemo(() => {
    const techExposure = (portfolioSectorWeights['Technology'] || 0) + (portfolioSectorWeights['Communication'] || 0);
    const defensiveExposure = (portfolioSectorWeights['Healthcare'] || 0) + (portfolioSectorWeights['Utilities'] || 0) + (portfolioSectorWeights['Consumer'] || 0);
    const cyclicalExposure = (portfolioSectorWeights['Finance'] || 0) + (portfolioSectorWeights['Industrial'] || 0) + (portfolioSectorWeights['Energy'] || 0) + (portfolioSectorWeights['Materials'] || 0);
    return { techExposure, defensiveExposure, cyclicalExposure };
  }, [portfolioSectorWeights]);

  const maxAssetWeight = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return 0;
    const weights = assets.map(a => (a.qty * a.price) / totalValue);
    return Math.max(...weights, 0);
  }, [assets]);

  const topSectorWeight = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    return Math.max(...weights, 0);
  }, [portfolioSectorWeights]);

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

  const portfolioStats = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + (a.qty * a.price), 0);
    const assetWeights = assets
      .map(a => ({
        ticker: a.ticker,
        value: a.qty * a.price,
        weight: totalValue > 0 ? (a.qty * a.price / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    const coreValue = assets.filter(a => a.type !== 'INCOME').reduce((s, a) => s + a.qty * a.price, 0);
    const incomeValue = assets.filter(a => a.type === 'INCOME').reduce((s, a) => s + a.qty * a.price, 0);

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

  // Total Value 도넛 차트
  useEffect(() => {
    if (!totalValueChartRef.current) return;
    const data = assets.filter(a => a.qty * a.price > 0);
    if (totalValueChartInstance.current) {
      totalValueChartInstance.current.destroy();
    }
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { animateRotate: false },
      },
    });
    return () => {
      if (totalValueChartInstance.current) {
        totalValueChartInstance.current.destroy();
        totalValueChartInstance.current = null;
      }
    };
  }, [assets]);

  // Sector 도넛 차트
  useEffect(() => {
    if (!sectorChartRef.current) return;
    if (sectorChartInstance.current) {
      sectorChartInstance.current.destroy();
    }
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { animateRotate: false },
      },
    });
    return () => {
      if (sectorChartInstance.current) {
        sectorChartInstance.current.destroy();
        sectorChartInstance.current = null;
      }
    };
  }, [topSectors]);

  // Type 도넛 차트
  useEffect(() => {
    if (!typeChartRef.current) return;
    if (typeChartInstance.current) {
      typeChartInstance.current.destroy();
    }
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: { animateRotate: false },
      },
    });
    return () => {
      if (typeChartInstance.current) {
        typeChartInstance.current.destroy();
        typeChartInstance.current = null;
      }
    };
  }, [portfolioStats.corePct, portfolioStats.incomePct]);

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
      <div className="glass-card p-5">
        {/* Row 1: Total Value, Weight, Sector, Type */}
        <div className="grid grid-cols-4 gap-4 mb-4">
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
        <div className="grid grid-cols-4 gap-4 mb-4">
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
        <div className="grid grid-cols-4 gap-4">
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
          <div className="inner-glass p-4 rounded-xl col-span-2">
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
