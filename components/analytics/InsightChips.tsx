'use client';

import { useMemo } from 'react';
import { InsightChip, InsightChipType, RiskMetrics, MarketData } from '@/lib/types';

interface RiskProfile {
  techExposure: number;
  defensiveExposure: number;
  cyclicalExposure: number;
}

interface InsightChipsProps {
  riskMetrics: RiskMetrics;
  riskProfile?: RiskProfile;
  market?: MarketData;
  maxAssetWeight?: number;
  topAssetTicker?: string;
  incomeAssetCount?: number;
}

const CHIP_ICONS: Record<InsightChipType, string> = {
  warning: 'exclamation-triangle',
  danger: 'exclamation-circle',
  success: 'check-circle',
  info: 'info-circle',
};

export default function InsightChips({
  riskMetrics,
  riskProfile,
  market,
  maxAssetWeight = 0,
  topAssetTicker,
  incomeAssetCount = 0,
}: InsightChipsProps) {
  const chips = useMemo(() => {
    const result: InsightChip[] = [];

    // 포트폴리오 건강 상태
    if (riskMetrics.overallScore >= 70) {
      result.push({
        type: 'success',
        icon: CHIP_ICONS.success,
        message: '포트폴리오 균형 양호',
      });
    }

    // 기술주 집중 경고
    if (riskProfile && riskProfile.techExposure > 0.4) {
      result.push({
        type: 'warning',
        icon: CHIP_ICONS.warning,
        message: `기술섹터 ${Math.round(riskProfile.techExposure * 100)}% 집중`,
      });
    }

    // 방어주 부족 안내
    if (riskProfile && riskProfile.defensiveExposure < 0.15) {
      result.push({
        type: 'info',
        icon: CHIP_ICONS.info,
        message: '방어자산 비중 확대 권장',
      });
    }

    // 단일 종목 집중 위험
    if (maxAssetWeight > 0.3 && topAssetTicker) {
      result.push({
        type: 'danger',
        icon: CHIP_ICONS.danger,
        message: `${topAssetTicker} ${Math.round(maxAssetWeight * 100)}% 과집중`,
      });
    } else if (maxAssetWeight > 0.2 && topAssetTicker) {
      result.push({
        type: 'warning',
        icon: CHIP_ICONS.warning,
        message: `${topAssetTicker} 비중 주의`,
      });
    }

    // VIX 상승 경고
    if (market && market.vix > 25) {
      result.push({
        type: 'warning',
        icon: CHIP_ICONS.warning,
        message: `VIX ${market.vix.toFixed(1)} 상승`,
      });
    } else if (market && market.vix < 15) {
      result.push({
        type: 'info',
        icon: CHIP_ICONS.info,
        message: '변동성 낮음 - 기회 탐색',
      });
    }

    // 분산도 낮음
    if (riskMetrics.diversificationScore < 40) {
      result.push({
        type: 'danger',
        icon: CHIP_ICONS.danger,
        message: '분산 투자 필요',
      });
    }

    // 배당주 분산 양호
    if (incomeAssetCount >= 3) {
      result.push({
        type: 'success',
        icon: CHIP_ICONS.success,
        message: `배당주 ${incomeAssetCount}개 분산`,
      });
    }

    // 금리 환경
    if (market && market.tnx > 4.5) {
      result.push({
        type: 'info',
        icon: CHIP_ICONS.info,
        message: '고금리 환경 - 채권 고려',
      });
    }

    return result;
  }, [riskMetrics, riskProfile, market, maxAssetWeight, topAssetTicker, incomeAssetCount]);

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="insight-chips-container" role="list" aria-label="포트폴리오 인사이트">
      {chips.map((chip, index) => (
        <div
          key={index}
          className={`insight-chip insight-chip-${chip.type}`}
          role="listitem"
        >
          <i className={`fas fa-${chip.icon} text-[10px]`} aria-hidden="true" />
          <span>{chip.message}</span>
        </div>
      ))}
    </div>
  );
}
