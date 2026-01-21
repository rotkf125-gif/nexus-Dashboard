// ═══════════════════════════════════════════════════════════════
// NEXUS V1.7 - Configuration Constants
// ═══════════════════════════════════════════════════════════════

import { SectorInfo, VIXLevel, Asset, AssetType, TypeInfo } from './types';

// ═══════════════════════════════════════════════════════════════
// SECTOR CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const SECTORS: Record<string, SectorInfo> = {
  Technology:    { emoji: '🖥️', color: '#90CAF9', label: 'Tech' },
  Healthcare:    { emoji: '🏥', color: '#81C784', label: 'Health' },
  Finance:       { emoji: '🏦', color: '#FFD700', label: 'Finance' },
  Energy:        { emoji: '⚡', color: '#FFB74D', label: 'Energy' },
  Consumer:      { emoji: '🛒', color: '#F48FB1', label: 'Consumer' },
  Industrial:    { emoji: '🏭', color: '#B39DDB', label: 'Industrial' },
  RealEstate:    { emoji: '🏠', color: '#CE93D8', label: 'RE' },
  Utilities:     { emoji: '💡', color: '#80DEEA', label: 'Util' },
  Materials:     { emoji: '🧱', color: '#FFCC80', label: 'Materials' },
  Communication: { emoji: '📡', color: '#9FA8DA', label: 'Comm' },
  ETF:           { emoji: '📊', color: '#B39DDB', label: 'ETF' },
  Crypto:        { emoji: '₿', color: '#F7931A', label: 'Crypto' },
  Other:         { emoji: '📦', color: '#90A4AE', label: 'Other' },
};

export const SECTOR_LIST = Object.keys(SECTORS);

// ═══════════════════════════════════════════════════════════════
// ASSET TYPE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const TYPE_ORDER: AssetType[] = ['CORE', 'GROWTH', 'VALUE', 'SPECULATIVE', 'INCOME'];

export const TYPE_COLORS: Record<AssetType, string> = {
  CORE: '#E0F7FA',
  INCOME: '#FFD700',
  GROWTH: '#81C784',
  VALUE: '#B39DDB',
  SPECULATIVE: '#E57373',
};

export const TYPE_INFO: Record<AssetType, TypeInfo> = {
  CORE: {
    label: 'CORE',
    icon: 'shield-alt',
    description: '핵심 보유 자산',
    color: '#E0F7FA'
  },
  INCOME: {
    label: 'INCOME',
    icon: 'coins',
    description: '배당/인컴 자산',
    color: '#FFD700'
  },
  GROWTH: {
    label: 'GROWTH',
    icon: 'rocket',
    description: '성장 투자 자산',
    color: '#81C784'
  },
  VALUE: {
    label: 'VALUE',
    icon: 'gem',
    description: '가치 투자 자산',
    color: '#B39DDB'
  },
  SPECULATIVE: {
    label: 'SPECULATIVE',
    icon: 'dice',
    description: '투기성 자산',
    color: '#E57373'
  },
};

// ═══════════════════════════════════════════════════════════════
// VIX LEVELS
// ═══════════════════════════════════════════════════════════════

export const VIX_LEVELS: Record<string, VIXLevel> = {
  LOW:     { max: 15, color: '#81C784', action: '정상 운용', label: 'LOW' },
  NORMAL:  { max: 25, color: '#FFD700', action: '모니터링 강화', label: 'NORMAL' },
  HIGH:    { max: 35, color: '#FFB74D', action: '방어적 포지션 권고', label: 'HIGH' },
  EXTREME: { max: 100, color: '#E57373', action: '긴급 리스크 점검', label: 'EXTREME' },
};

export function getVixLevel(vix: number): VIXLevel {
  if (vix <= VIX_LEVELS.LOW.max) return VIX_LEVELS.LOW;
  if (vix <= VIX_LEVELS.NORMAL.max) return VIX_LEVELS.NORMAL;
  if (vix <= VIX_LEVELS.HIGH.max) return VIX_LEVELS.HIGH;
  return VIX_LEVELS.EXTREME;
}

// ═══════════════════════════════════════════════════════════════
// CHART COLORS
// ═══════════════════════════════════════════════════════════════

export const CHART_COLORS = [
  '#90CAF9', '#FFD700', '#B39DDB', '#81C784', '#F48FB1',
  '#FFB74D', '#80DEEA', '#A5D6A7', '#90A4AE', '#CE93D8',
] as const;

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_EXCHANGE_RATE = 1450;

export const DEFAULT_ASSETS: Asset[] = [
  { ticker: 'PLTY', qty: 100, avg: 27.00, price: 0, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
  { ticker: 'HOOY', qty: 100, avg: 34.00, price: 0, type: 'INCOME', sector: 'ETF', buyRate: 1450 },
];

// ═══════════════════════════════════════════════════════════════
// BENCHMARK CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const BENCHMARK_TICKERS = [
  { ticker: 'SPY', name: 'S&P 500', color: '#90CAF9' },
  { ticker: 'QQQ', name: 'NASDAQ 100', color: '#81C784' },
  { ticker: 'DIA', name: 'Dow Jones', color: '#FFD700' },
  { ticker: 'VTI', name: 'Total Market', color: '#B39DDB' },
  { ticker: 'SCHD', name: 'Dividend', color: '#F48FB1' },
] as const;

// ═══════════════════════════════════════════════════════════════
// API CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const API_ENDPOINTS = {
  MARKET: '/api/market',
  PRICE: (ticker: string) => `/api/price/${ticker}`,
  BENCHMARK: '/api/benchmark',
} as const;

export const REFRESH_INTERVALS = {
  PRICE: 60000,      // 1 minute
  MARKET: 30000,     // 30 seconds
  SNAPSHOT: 1800000, // 30 minutes
} as const;

// ═══════════════════════════════════════════════════════════════
// TAX CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const TAX_CONFIG = {
  AFTER_TAX_RATE: 0.85,      // 세후 배당 비율 (15% 원천징수)
  DIVIDEND_TAX_RATE: 0.15,   // 배당 세율
} as const;

// ═══════════════════════════════════════════════════════════════
// UI CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const UI_CONFIG = {
  TOAST_DURATION: 3000,      // 토스트 표시 시간 (ms)
  DEBOUNCE_DELAY: 1000,      // 저장 디바운스 (ms)
  MAX_HISTORY: 10,           // Undo/Redo 히스토리 최대 개수
} as const;

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 AGENT MESH CONFIGURATION
// ═══════════════════════════════════════════════════════════════

import { AnalysisMode, SourceTier, GeopoliticalRiskLevel } from './types';

// 섹터별 민감도 데이터 (통합 - 중복 제거)
export const SECTOR_SENSITIVITY = {
  // 지정학적 민감도 (0-1)
  GEOPOLITICAL: {
    Technology: 0.85,
    Semiconductors: 0.90,
    Energy: 0.80,
    Defense: 0.75,
    Finance: 0.60,
    Healthcare: 0.30,
    Utilities: 0.20,
    Consumer: 0.40,
    Industrial: 0.55,
    Materials: 0.50,
    RealEstate: 0.35,
    Communication: 0.45,
    ETF: 0.50,
    Other: 0.40,
  } as Record<string, number>,
  
  // 금리 민감도 (0-1)
  RATE: {
    Technology: 0.80,
    RealEstate: 0.85,
    Utilities: 0.70,
    Finance: 0.65,
    Consumer: 0.50,
    Healthcare: 0.30,
    Energy: 0.40,
    Industrial: 0.55,
    Materials: 0.45,
    Communication: 0.60,
    ETF: 0.55,
    Other: 0.50,
  } as Record<string, number>,
} as const;

// VIX 임계값 (매직넘버 제거)
export const VIX_THRESHOLDS = {
  NORMAL: 15,
  ELEVATED: 20,
  HIGH: 25,
  EXTREME: 35,
} as const;

// 리스크 임계값
export const RISK_THRESHOLDS = {
  CONCENTRATION_WARNING: 0.30,  // 단일 종목 30% 이상
  SECTOR_WARNING: 0.40,         // 단일 섹터 40% 이상
  SENSITIVITY_HIGH: 0.70,       // 민감도 70% 이상
  SENSITIVITY_MODERATE: 0.50,   // 민감도 50% 이상
  EXPOSURE_HIGH: 0.30,          // 노출도 30% 이상
  EXPOSURE_MODERATE: 0.20,      // 노출도 20% 이상
  EXPOSURE_MIN: 0.05,           // 최소 노출도 5%
} as const;

export const FREEDOM_CONFIG = {
  VERSION: '31.0.0',
  CODENAME: 'Agent Mesh Edition',
  
  // 분석 모드 설정
  ANALYSIS_MODES: {
    quick: {
      label: 'Quick',
      description: '빠른 스크리닝 (QuantHead)',
      heads: ['quant'],
      estimatedTime: '5-10초',
      confidenceRange: '70-75%',
    },
    standard: {
      label: 'Standard',
      description: '일반 분석 (Quant + Macro)',
      heads: ['quant', 'macro'],
      estimatedTime: '15-20초',
      confidenceRange: '80-90%',
    },
    deep: {
      label: 'Deep',
      description: '정밀 분석 (Quant + Macro + Risk)',
      heads: ['quant', 'macro', 'risk'],
      estimatedTime: '30-45초',
      confidenceRange: '85-95%',
    },
  } as Record<AnalysisMode, {
    label: string;
    description: string;
    heads: string[];
    estimatedTime: string;
    confidenceRange: string;
  }>,

  // Source Tier 설정
  SOURCE_TIERS: {
    S: {
      name: 'Official Financial Data',
      icon: '[S]',
      confidence: 0.95,
      color: '#81C784',
      sources: [
        'sec.gov', 'yahoo.com', 'cboe.com', 'nyse.com', 'nasdaq.com', 'treasury.gov',
        'federalreserve.gov', 'ecb.europa.eu', 'boj.or.jp', 'bok.or.kr',
        'kofiabond.or.kr', 'fred.stlouisfed.org'
      ],
    },
    A: {
      name: 'Trusted Financial Media',
      icon: '[A]',
      confidence: 0.85,
      color: '#64B5F6',
      sources: [
        'bloomberg.com', 'reuters.com', 'wsj.com', 'ft.com', 'marketwatch.com',
        'barrons.com', 'economist.com', 'cnbc.com'
      ],
    },
    B: {
      name: 'Caution Required',
      icon: '[!]',
      confidence: 0.60,
      color: '#FFB74D',
      sources: ['reddit.com', 'twitter.com', 'x.com', 'youtube.com', 'blog', 'seekingalpha.com'],
    },
    C: {
      name: 'General Source',
      icon: '',
      confidence: 0.70,
      color: '#90A4AE',
      sources: [],
    },
  } as Record<SourceTier, {
    name: string;
    icon: string;
    confidence: number;
    color: string;
    sources: string[];
  }>,

  // 지정학적 리스크 레벨
  GEOPOLITICAL_RISK_LEVELS: {
    GREEN: {
      label: '정상',
      emoji: '🟢',
      color: '#81C784',
      action: '모니터링만',
    },
    YELLOW: {
      label: '주의',
      emoji: '🟡',
      color: '#FFD700',
      action: '포트폴리오 점검 권고',
    },
    ORANGE: {
      label: '경고',
      emoji: '🟠',
      color: '#FFB74D',
      action: '헤지 검토 권고',
    },
    RED: {
      label: '위험',
      emoji: '🔴',
      color: '#E57373',
      action: '즉시 대응 필요',
    },
  } as Record<GeopoliticalRiskLevel, {
    label: string;
    emoji: string;
    color: string;
    action: string;
  }>,

  // 에이전트 설정
  AGENTS: {
    // 항상 활성화
    ALWAYS_ACTIVE: [
      'MacroIndicatorAgent.InflationAgent',
      'MacroIndicatorAgent.LeadingIndicatorAgent',
      'StockMarketAgent.MarketSentimentAgent',
      'BondMarketAgent.USTreasuryAgent',
      'ForexAgent.DollarAgent',
    ],
    // VIX 기반 활성화
    VIX_TRIGGERS: {
      25: ['GeopoliticalRiskAgent'],
      35: ['CentralBankAgent.*', 'SectorAgent.*'],
    },
    // 포트폴리오 기반 활성화
    PORTFOLIO_TRIGGERS: {
      tech: ['SectorAgent.SemiconductorAgent'],
      energy: ['SectorAgent.EnergyAgent'],
      reits: ['SectorAgent.RealEstateAgent'],
      crypto: ['SectorAgent.CryptoAgent'],
      korean: ['CentralBankAgent.BOKAgent', 'ForexAgent.EmergingCurrencyAgent'],
    },
  },

  // Hardlock 규칙 (Truth Guardian)
  HARDLOCK: {
    P27: { rule: '확신도 90% 미만 정보 답변 거부', severity: 'CRITICAL' },
    P28: { rule: '추측성 어미 사용 금지', severity: 'HIGH' },
    P29: { rule: '확인되지 않은 정보 추측 생성 금지', severity: 'CRITICAL' },
    P30: { rule: 'CrossAgentValidator 미통과 데이터 사용 금지', severity: 'HIGH' },
    P31: { rule: '에이전트 간 불일치 미해결 상태로 결론 금지', severity: 'HIGH' },
    P32: { rule: '단일 에이전트 소스로 주요 결론 금지', severity: 'MEDIUM' },
  },

  // 추측성 표현 패턴 (Truth Guardian)
  SPECULATION_PATTERNS: {
    ko: [
      '것 같다', '것으로 보인다', '아마도', '추측하건대',
      '~일 수도', '예상된다', '추정된다', '가능성이 있다',
      '~일 것이다', '~할 것 같다', '~인 듯하다', '~로 보인다'
    ],
    en: [
      'might be', 'could be', 'probably', 'perhaps',
      'maybe', 'possibly', 'likely', 'seems to',
      'appears to', 'I think', 'I believe', 'presumably'
    ],
  },

  // 신뢰도 임계값
  CONFIDENCE_THRESHOLDS: {
    MIN_ACCEPTABLE: 0.90,  // 최소 허용 신뢰도
    HIGH: 0.85,
    MEDIUM: 0.70,
    LOW: 0.50,
  },

  // 예산 설정
  BUDGET: {
    BASE: 28000,
    MAX_OVERDRAFT: 5600,
  },
} as const;

// 지정학적 리스크 레벨 헬퍼
export function getGeopoliticalRiskInfo(level: GeopoliticalRiskLevel) {
  return FREEDOM_CONFIG.GEOPOLITICAL_RISK_LEVELS[level];
}

// Source Tier 헬퍼
export function getSourceTierInfo(tier: SourceTier) {
  return FREEDOM_CONFIG.SOURCE_TIERS[tier];
}

// 분석 모드 헬퍼
export function getAnalysisModeInfo(mode: AnalysisMode) {
  return FREEDOM_CONFIG.ANALYSIS_MODES[mode];
}