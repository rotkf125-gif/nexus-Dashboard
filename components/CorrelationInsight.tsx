'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';

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

// 섹터간 상관관계 매트릭스 (역사적 데이터 기반 추정)
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

export default function CorrelationInsight() {
  const { state } = useNexus();
  const { assets } = state;

  // 포트폴리오 섹터 분산도 계산
  const portfolioSectorWeights = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    if (totalValue === 0) return {};

    const sectorWeights: Record<string, number> = {};

    assets.forEach(asset => {
      const assetWeight = (asset.qty * asset.price) / totalValue;
      const etfSectors = ETF_SECTOR_DATA[asset.ticker];

      if (etfSectors) {
        // ETF인 경우 섹터 분산도 적용
        Object.entries(etfSectors).forEach(([sector, weight]) => {
          sectorWeights[sector] = (sectorWeights[sector] || 0) + assetWeight * weight;
        });
      } else {
        // 개별주인 경우 asset의 sector 사용
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

  // 분산도 점수 계산 (HHI 기반 - 낮을수록 분산 잘됨)
  const diversificationScore = useMemo(() => {
    const weights = Object.values(portfolioSectorWeights);
    if (weights.length === 0) return 0;
    
    // Herfindahl-Hirschman Index (HHI)
    const hhi = weights.reduce((sum, w) => sum + w * w, 0);
    // 0~100 점수로 변환 (1/n이 최소, 1이 최대)
    const minHHI = 1 / Math.max(weights.length, 1);
    const score = Math.max(0, 100 - ((hhi - minHHI) / (1 - minHHI)) * 100);
    return score;
  }, [portfolioSectorWeights]);

  // 시장 지수와의 상관관계 계산
  const marketCorrelations = useMemo(() => {
    const spySectors = ETF_SECTOR_DATA['SPY'] || {};
    const qqqSectors = ETF_SECTOR_DATA['QQQ'] || {};

    // 포트폴리오와 SPY 상관계수 계산
    let spyCorr = 0;
    let qqqCorr = 0;

    Object.entries(portfolioSectorWeights).forEach(([sector, weight]) => {
      const spyWeight = spySectors[sector] || 0;
      const qqqWeight = qqqSectors[sector] || 0;
      
      // 가중 상관계수
      spyCorr += weight * spyWeight * (SECTOR_CORRELATIONS[sector]?.[sector] || 0.5);
      qqqCorr += weight * qqqWeight * (SECTOR_CORRELATIONS[sector]?.[sector] || 0.5);
    });

    // 정규화 (0.3 ~ 0.95 범위로)
    spyCorr = Math.min(0.95, Math.max(0.3, spyCorr * 2 + 0.4));
    qqqCorr = Math.min(0.95, Math.max(0.3, qqqCorr * 2 + 0.3));

    return { spy: spyCorr, qqq: qqqCorr };
  }, [portfolioSectorWeights]);

  // 리스크 지표 계산
  const riskMetrics = useMemo(() => {
    const techExposure = (portfolioSectorWeights['Technology'] || 0) + (portfolioSectorWeights['Communication'] || 0);
    const defensiveExposure = (portfolioSectorWeights['Healthcare'] || 0) + (portfolioSectorWeights['Utilities'] || 0) + (portfolioSectorWeights['Consumer'] || 0);
    const cyclicalExposure = (portfolioSectorWeights['Finance'] || 0) + (portfolioSectorWeights['Industrial'] || 0) + (portfolioSectorWeights['Energy'] || 0) + (portfolioSectorWeights['Materials'] || 0);

    return { techExposure, defensiveExposure, cyclicalExposure };
  }, [portfolioSectorWeights]);

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
      <div className="text-center py-8 opacity-50">
        <i className="fas fa-project-diagram text-2xl mb-3 opacity-30" />
        <div className="text-[10px]">자산을 추가하세요</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Diversification Score */}
      <div className="inner-glass p-3 rounded-lg border border-celestial-cyan/20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] text-celestial-cyan tracking-widest">DIVERSIFICATION SCORE</span>
          <span className={`text-lg font-display ${
            diversificationScore >= 70 ? 'text-v64-success' : 
            diversificationScore >= 40 ? 'text-celestial-gold' : 'text-v64-danger'
          }`}>
            {diversificationScore.toFixed(0)}
          </span>
        </div>
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              diversificationScore >= 70 ? 'bg-v64-success' : 
              diversificationScore >= 40 ? 'bg-celestial-gold' : 'bg-v64-danger'
            }`}
            style={{ width: `${diversificationScore}%` }}
          />
        </div>
        <div className="text-[8px] opacity-40 mt-1 text-center">
          {diversificationScore >= 70 ? '우수한 분산' : diversificationScore >= 40 ? '보통 수준' : '집중 투자'}
        </div>
      </div>

      {/* Sector Breakdown */}
      <div className="inner-glass p-3 rounded-lg">
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
      <div className="grid grid-cols-2 gap-2">
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
      <div className="inner-glass p-3 rounded-lg">
        <div className="text-[9px] opacity-40 tracking-widest mb-2">RISK PROFILE</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-blue-400 font-mono">{(riskMetrics.techExposure * 100).toFixed(0)}%</div>
            <div className="text-[7px] opacity-40">Tech/성장</div>
          </div>
          <div>
            <div className="text-[10px] text-v64-success font-mono">{(riskMetrics.defensiveExposure * 100).toFixed(0)}%</div>
            <div className="text-[7px] opacity-40">방어주</div>
          </div>
          <div>
            <div className="text-[10px] text-celestial-gold font-mono">{(riskMetrics.cyclicalExposure * 100).toFixed(0)}%</div>
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
          {riskMetrics.techExposure > 0.5 ? (
            <>기술/성장 섹터 비중이 높아 <span className="text-blue-400">변동성</span>이 클 수 있습니다.</>
          ) : riskMetrics.defensiveExposure > 0.4 ? (
            <>방어적 섹터 비중이 높아 <span className="text-v64-success">안정적</span>인 포트폴리오입니다.</>
          ) : diversificationScore >= 60 ? (
            <>균형 잡힌 섹터 배분으로 <span className="text-celestial-gold">리스크 분산</span>이 잘 되어있습니다.</>
          ) : (
            <>특정 섹터 집중도가 높습니다. <span className="text-v64-warning">분산 투자</span>를 고려하세요.</>
          )}
        </div>
      </div>
    </div>
  );
}
