'use client';

import { useMemo } from 'react';
import { useNexus } from '@/lib/context';

interface CorrelationData {
  factor: string;
  label: string;
  correlation: number;
  description: string;
  icon: string;
}

export default function CorrelationInsight() {
  const { state } = useNexus();
  const { assets, market, exchangeRate } = state;

  // 포트폴리오 특성 분석
  const portfolioProfile = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    
    // 섹터별 비중
    const sectorWeights: Record<string, number> = {};
    assets.forEach(a => {
      const weight = totalValue > 0 ? (a.qty * a.price / totalValue) : 0;
      sectorWeights[a.sector] = (sectorWeights[a.sector] || 0) + weight;
    });

    // 타입별 비중
    const typeWeights: Record<string, number> = {};
    assets.forEach(a => {
      const weight = totalValue > 0 ? (a.qty * a.price / totalValue) : 0;
      typeWeights[a.type] = (typeWeights[a.type] || 0) + weight;
    });

    const techWeight = (sectorWeights['Technology'] || 0) + (sectorWeights['ETF'] || 0);
    const incomeWeight = typeWeights['INCOME'] || 0;
    const growthWeight = typeWeights['GROWTH'] || 0;

    return { techWeight, incomeWeight, growthWeight, totalValue };
  }, [assets]);

  // 상관관계 데이터 (시뮬레이션 기반 추정)
  const correlations = useMemo<CorrelationData[]>(() => {
    const { techWeight, incomeWeight } = portfolioProfile;

    // 기술주 비중에 따른 NASDAQ 상관관계
    const nasdaqCorr = 0.5 + techWeight * 0.4; // 0.5 ~ 0.9

    // VIX 역상관 (일반적으로 -0.6 ~ -0.8)
    const vixCorr = -0.6 - techWeight * 0.2;

    // 금리 상관관계 (INCOME 자산은 금리에 민감)
    const rateCorr = incomeWeight > 0.5 ? -0.5 : -0.3;

    // 환율 상관관계 (미국 주식이므로 양의 상관)
    const fxCorr = 0.3 + (1 - incomeWeight) * 0.2;

    // S&P 500 상관관계
    const spCorr = 0.6 + techWeight * 0.2;

    return [
      {
        factor: 'nasdaq',
        label: 'NASDAQ',
        correlation: nasdaqCorr,
        description: techWeight > 0.5 ? 'Tech 비중 높아 강한 연동' : '중간 수준 연동',
        icon: 'chart-line',
      },
      {
        factor: 'sp500',
        label: 'S&P 500',
        correlation: spCorr,
        description: '시장 전반과 동조',
        icon: 'chart-area',
      },
      {
        factor: 'vix',
        label: 'VIX',
        correlation: vixCorr,
        description: '변동성 확대 시 손실 예상',
        icon: 'bolt',
      },
      {
        factor: 'rate',
        label: 'US 10Y',
        correlation: rateCorr,
        description: incomeWeight > 0.5 ? '배당주 금리 민감' : '제한적 영향',
        icon: 'percentage',
      },
      {
        factor: 'usdkrw',
        label: 'USD/KRW',
        correlation: fxCorr,
        description: '원화 약세 시 환차익',
        icon: 'won-sign',
      },
    ];
  }, [portfolioProfile]);

  // 상관관계 색상
  const getCorrelationColor = (corr: number) => {
    if (corr >= 0.6) return 'text-v64-success';
    if (corr >= 0.3) return 'text-celestial-gold';
    if (corr >= -0.3) return 'text-white/60';
    if (corr >= -0.6) return 'text-v64-warning';
    return 'text-v64-danger';
  };

  // 상관관계 바 색상
  const getBarColor = (corr: number) => {
    if (corr >= 0) return 'bg-v64-success';
    return 'bg-v64-danger';
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
      {/* Header Info */}
      <div className="inner-glass p-3 rounded-lg">
        <div className="text-[9px] opacity-40 tracking-widest mb-2">PORTFOLIO PROFILE</div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div className="text-center">
            <div className="text-blue-400 font-mono">{(portfolioProfile.techWeight * 100).toFixed(0)}%</div>
            <div className="text-[8px] opacity-40">Tech</div>
          </div>
          <div className="text-center">
            <div className="text-celestial-gold font-mono">{(portfolioProfile.incomeWeight * 100).toFixed(0)}%</div>
            <div className="text-[8px] opacity-40">Income</div>
          </div>
          <div className="text-center">
            <div className="text-v64-success font-mono">{(portfolioProfile.growthWeight * 100).toFixed(0)}%</div>
            <div className="text-[8px] opacity-40">Growth</div>
          </div>
        </div>
      </div>

      {/* Correlation List */}
      <div className="space-y-2">
        {correlations.map((item) => (
          <div key={item.factor} className="inner-glass p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <i className={`fas fa-${item.icon} text-[10px] opacity-40`} />
                <span className="text-[10px] font-display tracking-wider">{item.label}</span>
              </div>
              <span className={`text-[11px] font-mono font-medium ${getCorrelationColor(item.correlation)}`}>
                {item.correlation > 0 ? '+' : ''}{item.correlation.toFixed(2)}
              </span>
            </div>
            
            {/* Correlation Bar */}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
              <div 
                className={`absolute top-0 h-full ${getBarColor(item.correlation)} transition-all`}
                style={{
                  left: item.correlation >= 0 ? '50%' : `${50 + item.correlation * 50}%`,
                  width: `${Math.abs(item.correlation) * 50}%`,
                }}
              />
            </div>

            <div className="text-[8px] opacity-50">{item.description}</div>
          </div>
        ))}
      </div>

      {/* Insight Summary */}
      <div className="inner-glass p-3 rounded-lg border border-celestial-purple/20">
        <div className="text-[9px] text-celestial-purple tracking-widest mb-2">
          <i className="fas fa-lightbulb mr-1" />
          KEY INSIGHT
        </div>
        <div className="text-[10px] text-white/80 leading-relaxed">
          {portfolioProfile.techWeight > 0.6 ? (
            <>Tech 비중이 높아 NASDAQ과 <span className="text-v64-success">강한 양의 상관관계</span>를 보입니다. VIX 급등 시 주의가 필요합니다.</>
          ) : portfolioProfile.incomeWeight > 0.5 ? (
            <>배당 중심 포트폴리오로 금리 변동에 <span className="text-v64-warning">민감</span>합니다. 금리 인상기에는 방어적 운용을 권장합니다.</>
          ) : (
            <>균형 잡힌 포트폴리오로 시장 변동에 <span className="text-white">중간 수준</span>으로 반응합니다.</>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[8px] opacity-40">
        <span><span className="text-v64-danger">●</span> 역상관</span>
        <span><span className="text-white/60">●</span> 무관</span>
        <span><span className="text-v64-success">●</span> 양상관</span>
      </div>
    </div>
  );
}
