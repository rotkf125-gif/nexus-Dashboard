// ═══════════════════════════════════════════════════════════════
// NEXUS V1.7 - Type Definitions
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// CORE TYPES
// ═══════════════════════════════════════════════════════════════

export type AssetType = 'CORE' | 'INCOME' | 'GROWTH' | 'VALUE' | 'SPECULATIVE';
export type ThemeType = 'dark' | 'light';
export type MarketState = 'PRE' | 'REGULAR' | 'POST' | 'CLOSED' | 'DAY';

export interface Asset {
  ticker: string;
  qty: number;
  avg: number;
  price: number;
  type: AssetType;
  sector: string;
  buyRate: number;
}

export interface AssetWithIndex extends Asset {
  originalIndex: number;
}

export interface Dividend {
  date: string;
  ticker: string;
  qty: number;
  dps: number;
}

export type TradeType = 'BUY' | 'SELL';

export interface TradeLog {
  id: string;
  date: string;
  ticker: string;
  type: TradeType;
  qty: number;
  price: number;
  fee: number;
}

export interface TimelineEntry {
  date: string;
  cost: number;
  value: number;
}

export interface MarketData {
  nasdaq: number;
  sp500: number;
  vix: number;
  tnx: number;
  krw: number;
  marketState?: MarketState;
}

export interface TradeSums {
  [ticker: string]: number;
}

export interface NexusState {
  assets: Asset[];
  dividends: Dividend[];
  tradeLogs: TradeLog[];
  timeline: TimelineEntry[];
  exchangeRate: number;
  tradeSums: TradeSums;
  scriptUrl: string;
  strategy: string;
  theme: ThemeType;
  market: MarketData;
  previousMarket: MarketData;
  previousPrices: Record<string, number>;
  lastSync: number | null;
  compactMode: boolean;
  vixAlertDismissed: boolean;
  isFetching: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONFIG TYPES
// ═══════════════════════════════════════════════════════════════

export interface SectorInfo {
  emoji: string;
  color: string;
  label: string;
}

export interface VIXLevel {
  max: number;
  color: string;
  action: string;
  label: string;
}

export interface TypeInfo {
  label: string;
  icon: string;
  description: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

export interface PriceResponse {
  ticker: string;
  price: number;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

export interface MarketResponse extends MarketData {
  timestamp: number;
}

export interface BenchmarkData {
  name: string;
  ticker: string;
  ytdReturn: number;
  currentPrice: number;
  yearStartPrice: number;
  color: string;
}

export interface BenchmarkResponse {
  benchmarks: BenchmarkData[];
  timestamp: number;
}

export interface SheetSyncResponse {
  dividends: Dividend[];
  tradeSums?: TradeSums;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT PROP TYPES
// ═══════════════════════════════════════════════════════════════

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface AssetModalProps extends ModalProps {
  onSave: (asset: Asset) => void;
  editingAsset: Asset | null;
  editingIndex: number | null;
  exchangeRate: number;
}

export interface TradeModalProps extends ModalProps {
  onSave: (trade: TradeLog) => void;
  editingTrade: TradeLog | null;
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION TYPES
// ═══════════════════════════════════════════════════════════════

export interface WhatIfScenario {
  ticker: string;
  priceChange: number;
  qtyChange: number;
}

export interface RebalanceTarget {
  ticker: string;
  currentWeight: number;
  targetWeight: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
}

export interface CorrelationData {
  ticker1: string;
  ticker2: string;
  correlation: number;
}

// ═══════════════════════════════════════════════════════════════
// SNAPSHOT TYPES
// ═══════════════════════════════════════════════════════════════

export interface PortfolioSnapshot {
  id: string;
  user_id: string;
  timestamp: string;
  total_value: number;
  total_cost: number;
  return_pct: number;
  exchange_rate: number;
  assets: Asset[];
  market: MarketData;
}

// ═══════════════════════════════════════════════════════════════
// HISTORIC PERFORMANCE TYPES
// ═══════════════════════════════════════════════════════════════

export type HistoricPeriod = '24h' | '1w' | '1m';

export interface HistoricDataPoint {
  timestamp: string;
  totalValue: number;
  totalCost: number;
  returnPct: number;
}

// ═══════════════════════════════════════════════════════════════
// RISK ANALYTICS TYPES
// ═══════════════════════════════════════════════════════════════

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface RiskMetrics {
  overallScore: number;
  diversificationScore: number;
  sectorConcentration: number;
  volatilityScore: number;
  concentrationRisk: number;
}

// ═══════════════════════════════════════════════════════════════
// BUBBLE CHART TYPES
// ═══════════════════════════════════════════════════════════════

export type BubbleColorMode = 'sector' | 'type' | 'performance';

export interface BubbleDataPoint {
  x: number;           // 비중 %
  y: number;           // 수익률 %
  r: number;           // 버블 반지름
  ticker: string;
  sector: string;
  type: AssetType;
  value: number;       // 평가금액
  cost: number;        // 원금
  returnPct: number;   // 수익률 %
  color: string;       // 색상
}

export type InsightChipType = 'warning' | 'danger' | 'success' | 'info';

export interface InsightChip {
  type: InsightChipType;
  icon: string;
  message: string;
}

// ═══════════════════════════════════════════════════════════════
// WIDGET API TYPES
// ═══════════════════════════════════════════════════════════════

export interface WidgetHolding {
  ticker: string;
  value: number;
  returnPct: number;
}

export interface WidgetData {
  timestamp: number;
  totalValue: number;
  totalValueKRW: number;
  todayReturn: number;
  todayReturnPct: number;
  topHoldings: WidgetHolding[];
  marketState: string;
  exchangeRate: number;
}

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 AGENT MESH TYPES
// Agent Mesh 아키텍처 기반 AI 분석 시스템 타입 정의
// ═══════════════════════════════════════════════════════════════

/** 분석 모드: quick(빠른), standard(일반), deep(정밀) */
export type AnalysisMode = 'quick' | 'standard' | 'deep';

/** 지정학적 리스크 레벨 */
export type GeopoliticalRiskLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

/** 데이터 출처 신뢰도 등급 */
export type SourceTier = 'S' | 'A' | 'B' | 'C';

/** 에이전트 상태 */
export type AgentStatus = 'active' | 'warning' | 'inactive' | 'error';

// 에이전트 기여도
export interface AgentContribution {
  id: string;
  name: string;
  status: AgentStatus;
  contribution: number;
  keyFinding: string;
  dataQuality: number;
}

// 에이전트 합의
export interface AgentConsensus {
  topic: string;
  agreementLevel: 'full' | 'partial' | 'disagreement';
  agentCount: number;
  totalAgents: number;
  dissentingView?: string;
}

// 출처 참조
export interface SourceReference {
  name: string;
  tier: SourceTier;
  dataType: string;
  confidence: number;
  url?: string;
}

// 지정학적 이슈
export interface GeopoliticalIssue {
  issue: string;
  status: GeopoliticalRiskLevel;
  impactSectors: string[];
  portfolioExposure: number;
}

// 지정학적 리스크
export interface GeopoliticalRisk {
  level: GeopoliticalRiskLevel;
  issues: GeopoliticalIssue[];
  recommendations: string[];
}

// QuantHead 분석 결과
export interface QuantAnalysis {
  portfolioMetrics: {
    totalValue: number;
    totalCost: number;
    returnPct: number;
    concentrationRisk: number;
    diversificationScore: number;
  };
  sectorAllocation: Array<{
    sector: string;
    weight: number;
    status: string;
  }>;
  topHoldings: Array<{
    ticker: string;
    weight: number;
    returnPct: number;
  }>;
}

// MacroHead 분석 결과
export interface MacroAnalysis {
  marketEnvironment: {
    vix: number;
    vixStatus: string;
    tnx: number;
    tnxStatus: string;
    dxy?: number;
    dxyStatus?: string;
  };
  centralBankPolicy: {
    fed?: {
      currentRate: number;
      outlook: string;
      nextMeeting?: string;
    };
    bok?: {
      currentRate: number;
      outlook: string;
      rateDiff?: number;
    };
  };
  macroIndicators: string[];
}

// RiskHead 분석 결과
export interface RiskAnalysis {
  geopoliticalRisk: GeopoliticalRisk;
  sectorRisk: Array<{
    sector: string;
    level: GeopoliticalRiskLevel;
    reason: string;
  }>;
  marketRisk: {
    volatility: GeopoliticalRiskLevel;
    liquidity: GeopoliticalRiskLevel;
    sentiment: string;
  };
  overallLevel: GeopoliticalRiskLevel;
  recommendedAction: string;
}

/**
 * Freedom 분석 결과 (전체)
 * API 응답을 구조화된 형태로 파싱할 때 사용
 * 현재는 마크다운 텍스트로 반환되어 직접 사용되지 않음
 * 향후 구조화된 응답 파싱 시 활용 예정
 */
export interface FreedomAnalysisResult {
  mode: AnalysisMode;
  timestamp: string;
  agents: AgentContribution[];
  consensus: AgentConsensus[];
  crossValidation: {
    consistencyScore: number;
    conflictsResolved: number;
    resolutionMethod: string;
  };
  quantAnalysis: QuantAnalysis;
  macroAnalysis: MacroAnalysis;
  riskAnalysis?: RiskAnalysis; // Deep 모드에서만
  scenarios: {
    base: { probability: number; description: string };
    bull: { probability: number; description: string };
    bear: { probability: number; description: string };
  };
  actionItems: {
    high: string[];
    medium: string[];
    low: string[];
  };
  confidence: {
    overall: number;
    hydraConfidence: number;
    agentConsensus: number;
    sourceConfidence: number;
  };
  sources: SourceReference[];
  disclaimer: string;
}

/**
 * Freedom API 요청 타입
 * FreedomModal에서 API 호출 시 사용되는 페이로드 구조
 */
export interface FreedomAnalysisRequest {
  portfolioData: {
    timestamp: string;
    userProfile: {
      strategy: string;
      riskTolerance: string;
    };
    summary: {
      totalValue: number;
      totalCost: number;
      totalReturn: number;
      totalReturnPct: number | string;
    };
    groups: {
      bySector: Array<{
        name: string;
        weight: string;
        returnPct: number | string;
        assetCount: number;
      }>;
      byType: Array<{
        name: string;
        weight: string;
        returnPct: number | string;
        assetCount: number;
      }>;
    };
    income: {
      annualTotal: string;
      monthlyTrend: string;
      payingAssetsCount: number;
    };
    assets: Array<{
      ticker: string;
      qty: number;
      avg: number;
      price: number;
      weight: string;
      returnPct: number | string;
      sector: string;
      type: string;
    }>;
    market: MarketData;
  };
  mode: AnalysisMode;
}
