import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { AnalysisMode } from '@/lib/types';
import { FREEDOM_V31_SYSTEM_PROMPT, MODE_PROMPTS } from '@/lib/prompts';
import { VIX_THRESHOLDS } from '@/lib/config';

// ═══════════════════════════════════════════════════════════════
// FREEDOM v31.0 AGENT MESH EDITION - AI Analysis API
// 최적화: 프롬프트 분리, 에러 처리 강화, 상수 사용
// ═══════════════════════════════════════════════════════════════

// 에러 타입 정의
interface FreedomError extends Error {
  code?: string;
  status?: number;
}

// 반도체 관련 티커 목록
const SEMICONDUCTOR_TICKERS = ['NVDA', 'AMD', 'INTC', 'TSM', 'ASML', 'AVGO', 'QCOM', 'MU'];

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.', code: 'API_KEY_MISSING' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const { portfolioData, mode = 'standard' } = body as {
      portfolioData: Record<string, unknown>;
      mode?: AnalysisMode;
    };

    if (!portfolioData) {
      return NextResponse.json(
        { error: '포트폴리오 데이터가 없습니다.', code: 'MISSING_DATA' },
        { status: 400 }
      );
    }

    // 유효한 모드인지 확인
    if (!['quick', 'standard', 'deep'].includes(mode)) {
      return NextResponse.json(
        { error: '유효하지 않은 분석 모드입니다.', code: 'INVALID_MODE' },
        { status: 400 }
      );
    }

    // VIX 기반 동적 에이전트 활성화 체크 (상수 사용)
    const vix = (portfolioData.market as Record<string, number>)?.vix || 15;
    const isHighVix = vix > VIX_THRESHOLDS.HIGH;
    const isExtremeVix = vix > VIX_THRESHOLDS.EXTREME;

    // 에이전트 활성화 상태 결정
    const activeAgents = determineActiveAgents(portfolioData, mode, vix);

    // Gemini API 호출
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    // 프롬프트 구성 (분리된 파일에서 import)
    const modePrompt = MODE_PROMPTS[mode];
    const dynamicContext = buildDynamicContext(portfolioData, activeAgents, vix, isHighVix, isExtremeVix);

    const fullPrompt = `${FREEDOM_V31_SYSTEM_PROMPT}

${modePrompt}

${dynamicContext}

---

## 분석 대상 포트폴리오 데이터

\`\`\`json
${JSON.stringify(portfolioData, null, 2)}
\`\`\`

---

위 데이터를 기반으로 Freedom v31.0 Agent Mesh Edition 형식에 맞춰 분석을 수행하세요.
분석 모드: **${mode.toUpperCase()}**
활성화된 에이전트: ${activeAgents.join(', ')}
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const analysis = response.text();

    // 응답에 메타데이터 추가
    return NextResponse.json({
      analysis,
      metadata: {
        version: '31.0.0',
        mode,
        activeAgents,
        vixLevel: vix,
        isHighVix,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Freedom v31 Analysis Error:', error);
    
    // 에러 타입별 처리
    const err = error as FreedomError;
    
    if (err.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI 서비스 인증 오류입니다.', code: 'AUTH_ERROR' },
        { status: 401 }
      );
    }
    
    if (err.message?.includes('quota') || err.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'AI 서비스 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }
    
    if (err.message?.includes('timeout')) {
      return NextResponse.json(
        { error: '분석 시간이 초과되었습니다. 다시 시도해주세요.', code: 'TIMEOUT' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', code: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

// 활성화할 에이전트 결정 (상수 사용)
function determineActiveAgents(
  portfolioData: Record<string, unknown>,
  mode: AnalysisMode,
  vix: number
): string[] {
  const agents: string[] = [];

  // 항상 활성화 (모든 모드)
  agents.push('QuantHead');

  if (mode === 'quick') {
    return agents;
  }

  // Standard 이상
  agents.push(
    'MacroHead',
    'MacroIndicatorAgent.InflationAgent',
    'MacroIndicatorAgent.LeadingIndicatorAgent',
    'StockMarketAgent.MarketSentimentAgent',
    'BondMarketAgent.USTreasuryAgent',
    'ForexAgent.DollarAgent'
  );

  if (mode === 'standard') {
    return agents;
  }

  // Deep 모드
  agents.push(
    'RiskHead',
    'CentralBankAgent.FedAgent',
    'CentralBankAgent.BOKAgent',
    'BondMarketAgent.KoreaBondAgent'
  );

  // VIX 기반 동적 활성화 (상수 사용)
  if (vix > VIX_THRESHOLDS.HIGH) {
    agents.push('GeopoliticalRiskAgent');
  }
  if (vix > VIX_THRESHOLDS.EXTREME) {
    agents.push('SectorAgent.*');
  }

  // 포트폴리오 기반 섹터 에이전트 활성화
  const assets = portfolioData.assets as Array<{ sector?: string; ticker?: string }> || [];
  const sectors = new Set(assets.map(a => a.sector).filter(Boolean));
  
  if (sectors.has('Technology') || assets.some(a => 
    SEMICONDUCTOR_TICKERS.includes(a.ticker || '')
  )) {
    agents.push('SectorAgent.SemiconductorAgent');
  }
  if (sectors.has('Energy')) {
    agents.push('SectorAgent.EnergyAgent');
  }
  if (sectors.has('RealEstate')) {
    agents.push('SectorAgent.RealEstateAgent');
  }
  if (sectors.has('Crypto')) {
    agents.push('SectorAgent.CryptoAgent');
  }

  return Array.from(new Set(agents)); // 중복 제거
}

// 동적 컨텍스트 생성 (상수 사용)
function buildDynamicContext(
  portfolioData: Record<string, unknown>,
  activeAgents: string[],
  vix: number,
  isHighVix: boolean,
  isExtremeVix: boolean
): string {
  const vixStatus = isExtremeVix 
    ? '🔴 극단적 변동성' 
    : isHighVix 
      ? '🟠 높은 변동성' 
      : vix > VIX_THRESHOLDS.ELEVATED 
        ? '🟡 주의' 
        : '🟢 정상';

  let context = `## 동적 컨텍스트

### 시장 상황
- VIX: ${vix} (${vixStatus})
`;

  if (isHighVix) {
    context += `
### ⚠️ 높은 변동성 경고
VIX가 ${vix}로 높은 수준입니다. GeopoliticalRiskAgent가 자동 활성화되었습니다.
지정학적 리스크 분석을 포함하여 방어적 관점에서 분석을 수행하세요.
`;
  }

  if (isExtremeVix) {
    context += `
### 🚨 극단적 변동성 경고
VIX가 ${vix}로 극단적 수준입니다. 모든 에이전트가 활성화되었습니다.
위기 상황 대응 관점에서 분석하고, 즉각적인 행동 권고를 포함하세요.
`;
  }

  // 포트폴리오 특성 분석
  const assets = portfolioData.assets as Array<{ type?: string; sector?: string }> || [];
  const incomeAssets = assets.filter(a => a.type === 'INCOME');
  const techAssets = assets.filter(a => a.sector === 'Technology' || a.sector === 'ETF');

  if (incomeAssets.length > 0) {
    context += `
### 포트폴리오 특성: 인컴 자산 보유
INCOME 타입 자산 ${incomeAssets.length}개 보유. 배당 안정성 및 인컴 스트림 분석을 강화하세요.
`;
  }

  if (techAssets.length > assets.length * 0.4) {
    context += `
### 포트폴리오 특성: 기술주 집중
기술 섹터 비중이 높습니다. SemiconductorAgent 분석을 포함하고, 
금리 민감도 및 성장주 리스크를 상세히 분석하세요.
`;
  }

  context += `
### 활성화된 에이전트 목록
${activeAgents.map(a => `- ${a}`).join('\n')}
`;

  return context;
}
