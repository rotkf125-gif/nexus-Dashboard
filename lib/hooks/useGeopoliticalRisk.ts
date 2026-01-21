import { useMemo } from 'react';
import { Asset, MarketData, GeopoliticalRiskLevel, GeopoliticalIssue } from '../types';
import { 
  FREEDOM_CONFIG, 
  getGeopoliticalRiskInfo, 
  SECTOR_SENSITIVITY, 
  VIX_THRESHOLDS,
  RISK_THRESHOLDS 
} from '../config';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 - Geopolitical Risk Hook
// GeopoliticalRiskAgent 기반 지정학적 리스크 분석
// 최적화: config에서 민감도 데이터 참조 (중복 제거)
// ═══════════════════════════════════════════════════════════════

// 지정학적 이슈 데이터베이스 (실시간 업데이트 필요 시 API로 대체)
const GEOPOLITICAL_ISSUES_DB: GeopoliticalIssue[] = [
  {
    issue: '미중 기술 갈등',
    status: 'YELLOW',
    impactSectors: ['Technology', 'Semiconductors'],
    portfolioExposure: 0,
  },
  {
    issue: '중동 지역 긴장',
    status: 'YELLOW',
    impactSectors: ['Energy', 'Defense'],
    portfolioExposure: 0,
  },
  {
    issue: '우크라이나 분쟁',
    status: 'ORANGE',
    impactSectors: ['Energy', 'Agriculture', 'Defense'],
    portfolioExposure: 0,
  },
  {
    issue: '대만 해협 리스크',
    status: 'YELLOW',
    impactSectors: ['Technology', 'Semiconductors', 'Manufacturing'],
    portfolioExposure: 0,
  },
  {
    issue: '글로벌 공급망 재편',
    status: 'YELLOW',
    impactSectors: ['Manufacturing', 'Technology', 'Logistics'],
    portfolioExposure: 0,
  },
];

// VIX 기반 리스크 레벨 결정 (상수 사용)
function getVixBasedRiskLevel(vix: number): GeopoliticalRiskLevel {
  if (vix >= VIX_THRESHOLDS.EXTREME) return 'RED';
  if (vix >= VIX_THRESHOLDS.HIGH) return 'ORANGE';
  if (vix >= VIX_THRESHOLDS.ELEVATED) return 'YELLOW';
  return 'GREEN';
}

// 포트폴리오 섹터 노출도 계산
function calculateSectorExposure(
  assets: Asset[],
  targetSectors: string[]
): number {
  const totalValue = assets.reduce((sum, a) => sum + a.price * a.qty, 0);
  if (totalValue === 0) return 0;

  const exposedValue = assets
    .filter(a => targetSectors.includes(a.sector || 'Other'))
    .reduce((sum, a) => sum + a.price * a.qty, 0);

  return exposedValue / totalValue;
}

// 포트폴리오 지정학적 민감도 계산 (config 참조)
function calculateGeopoliticalSensitivity(assets: Asset[]): number {
  const totalValue = assets.reduce((sum, a) => sum + a.price * a.qty, 0);
  if (totalValue === 0) return 0;

  let weightedSensitivity = 0;
  assets.forEach(asset => {
    const value = asset.price * asset.qty;
    const weight = value / totalValue;
    const sensitivity = SECTOR_SENSITIVITY.GEOPOLITICAL[asset.sector || 'Other'] || 0.4;
    weightedSensitivity += weight * sensitivity;
  });

  return weightedSensitivity;
}

export interface GeopoliticalRiskAnalysis {
  overallLevel: GeopoliticalRiskLevel;
  vixLevel: GeopoliticalRiskLevel;
  portfolioSensitivity: number;
  issues: GeopoliticalIssue[];
  recommendations: string[];
  riskScore: number;
  levelInfo: {
    label: string;
    emoji: string;
    color: string;
    action: string;
  };
  sectorExposures: Array<{
    sector: string;
    exposure: number;
    sensitivity: number;
    riskContribution: number;
  }>;
}

export function useGeopoliticalRisk(
  assets: Asset[],
  market: MarketData
): GeopoliticalRiskAnalysis {
  const vix = market.vix || 15;

  // VIX 기반 리스크 레벨
  const vixLevel = useMemo(() => getVixBasedRiskLevel(vix), [vix]);

  // 포트폴리오 지정학적 민감도
  const portfolioSensitivity = useMemo(
    () => calculateGeopoliticalSensitivity(assets),
    [assets]
  );

  // 섹터별 노출도 및 리스크 기여도
  const sectorExposures = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.price * a.qty, 0);
    if (totalValue === 0) return [];

    const sectorValues: Record<string, number> = {};
    assets.forEach(asset => {
      const sector = asset.sector || 'Other';
      sectorValues[sector] = (sectorValues[sector] || 0) + asset.price * asset.qty;
    });

    return Object.entries(sectorValues)
      .map(([sector, value]) => {
        const exposure = value / totalValue;
        const sensitivity = SECTOR_SENSITIVITY.GEOPOLITICAL[sector] || 0.4;
        return {
          sector,
          exposure,
          sensitivity,
          riskContribution: exposure * sensitivity,
        };
      })
      .sort((a, b) => b.riskContribution - a.riskContribution);
  }, [assets]);

  // 이슈별 포트폴리오 노출도 계산 (상수 사용)
  const issuesWithExposure = useMemo(() => {
    return GEOPOLITICAL_ISSUES_DB.map(issue => ({
      ...issue,
      portfolioExposure: calculateSectorExposure(assets, issue.impactSectors),
    })).filter(issue => issue.portfolioExposure > RISK_THRESHOLDS.EXPOSURE_MIN);
  }, [assets]);

  // 종합 리스크 레벨 결정 (상수 사용)
  const overallLevel = useMemo((): GeopoliticalRiskLevel => {
    // VIX가 극단적이면 최우선
    if (vix >= VIX_THRESHOLDS.EXTREME) return 'RED';

    // 높은 노출도의 심각한 이슈가 있으면
    const hasHighExposureRedIssue = issuesWithExposure.some(
      i => i.status === 'RED' && i.portfolioExposure > RISK_THRESHOLDS.EXPOSURE_MODERATE
    );
    if (hasHighExposureRedIssue) return 'RED';

    const hasHighExposureOrangeIssue = issuesWithExposure.some(
      i => i.status === 'ORANGE' && i.portfolioExposure > RISK_THRESHOLDS.EXPOSURE_HIGH
    );
    if (hasHighExposureOrangeIssue || vix >= VIX_THRESHOLDS.HIGH) return 'ORANGE';

    // 포트폴리오 민감도가 높으면
    if (portfolioSensitivity > RISK_THRESHOLDS.SENSITIVITY_HIGH && vix >= VIX_THRESHOLDS.ELEVATED) return 'ORANGE';

    const hasYellowIssue = issuesWithExposure.some(
      i => i.status === 'YELLOW' && i.portfolioExposure > RISK_THRESHOLDS.EXPOSURE_MODERATE
    );
    if (hasYellowIssue || vix >= VIX_THRESHOLDS.ELEVATED || portfolioSensitivity > RISK_THRESHOLDS.SENSITIVITY_MODERATE + 0.1) return 'YELLOW';

    return 'GREEN';
  }, [vix, issuesWithExposure, portfolioSensitivity]);

  // 리스크 점수 계산 (0-100)
  const riskScore = useMemo(() => {
    const vixScore = Math.min(100, (vix / 40) * 100);
    const sensitivityScore = portfolioSensitivity * 100;
    const issueScore = issuesWithExposure.reduce((sum, issue) => {
      const levelMultiplier =
        issue.status === 'RED' ? 1 : issue.status === 'ORANGE' ? 0.7 : 0.4;
      return sum + issue.portfolioExposure * levelMultiplier * 100;
    }, 0);

    return Math.min(100, Math.round(
      vixScore * 0.4 + sensitivityScore * 0.3 + issueScore * 0.3
    ));
  }, [vix, portfolioSensitivity, issuesWithExposure]);

  // 권고사항 생성
  const recommendations = useMemo(() => {
    const recs: string[] = [];

    if (overallLevel === 'RED') {
      recs.push('즉시 포트폴리오 방어 태세 점검 필요');
      recs.push('고위험 섹터 비중 축소 검토');
      recs.push('현금 비중 확대 고려');
    } else if (overallLevel === 'ORANGE') {
      recs.push('헤지 포지션 구축 검토');
      recs.push('지정학적 민감 섹터 모니터링 강화');
    } else if (overallLevel === 'YELLOW') {
      recs.push('포트폴리오 분산도 점검');
      recs.push('뉴스 및 시장 동향 주시');
    }

    // 특정 이슈 기반 권고 (상수 사용)
    issuesWithExposure.forEach(issue => {
      if (issue.portfolioExposure > RISK_THRESHOLDS.EXPOSURE_HIGH && issue.status !== 'GREEN') {
        recs.push(
          `${issue.issue} 관련 노출도 ${(issue.portfolioExposure * 100).toFixed(0)}% - 리스크 관리 필요`
        );
      }
    });

    // 민감도 기반 권고 (상수 사용)
    if (portfolioSensitivity > RISK_THRESHOLDS.SENSITIVITY_HIGH) {
      recs.push('포트폴리오 지정학적 민감도가 높음 - 방어적 섹터 추가 고려');
    }

    return recs.slice(0, 5); // 최대 5개
  }, [overallLevel, issuesWithExposure, portfolioSensitivity]);

  const levelInfo = getGeopoliticalRiskInfo(overallLevel);

  return {
    overallLevel,
    vixLevel,
    portfolioSensitivity,
    issues: issuesWithExposure,
    recommendations,
    riskScore,
    levelInfo,
    sectorExposures,
  };
}

// 헬퍼: 리스크 레벨 비교
export function isRiskLevelHigherOrEqual(
  level: GeopoliticalRiskLevel,
  threshold: GeopoliticalRiskLevel
): boolean {
  const order: GeopoliticalRiskLevel[] = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
  return order.indexOf(level) >= order.indexOf(threshold);
}

// 헬퍼: 리스크 레벨 숫자 변환
export function riskLevelToNumber(level: GeopoliticalRiskLevel): number {
  const mapping: Record<GeopoliticalRiskLevel, number> = {
    GREEN: 1,
    YELLOW: 2,
    ORANGE: 3,
    RED: 4,
  };
  return mapping[level];
}
