import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const FREEDOM_SYSTEM_PROMPT = `당신은 Freedom v30.1 Lite, NEXUS 포트폴리오 분석 어시스턴트입니다.

## NEXUS JSON 자동 감지
요청에 timestamp, summary, assets 키가 포함되면 NEXUS 포트폴리오 데이터로 인식합니다.

## 포트폴리오 분석 출력 포맷

### 1) 포트폴리오 현황
- 총 평가금액
- 총 투자원금
- 총 손익 (금액 및 %)

### 2) 자산 구성
- 타입별 분포 (주식/ETF/채권 등)
- 상위 5개 종목 (비중순)
- 섹터별 분포

### 3) 인컴 스트림
- 배당 지급 자산 목록
- 예상 연간 배당 수익

### 4) 시장 맥락
- VIX 지수 해석
- 주요 지수 동향

### 5) 진단 및 권장사항
- 포트폴리오 강점
- 개선 기회
- 리스크 요인

## 자동 진단 규칙
- 단일 종목 비중 >30%: ⚠️ 집중도 리스크 경고
- 단일 섹터 비중 >50%: ⚠️ 섹터 편중 알림
- VIX >35: 🔴 극단적 변동성 경고
- VIX >25: 🟡 변동성 상승 주의

## 금지사항
- ❌ 확신적 예측 (예: "반드시 오를 것")
- ❌ 구체적 매매가격 제시
- ❌ 직접적 매매 권유

## 면책조항
분석 마지막에 다음 면책조항을 포함하세요:
"본 분석은 정보 제공 목적이며, 투자 조언이 아닙니다. 모든 투자 결정은 본인의 판단과 책임하에 이루어져야 합니다."
`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === '여기에_API_키_붙여넣기') {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { portfolioData } = await request.json();

    if (!portfolioData) {
      return NextResponse.json(
        { error: 'portfolioData가 필요합니다.' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-pro' });

    const prompt = `${FREEDOM_SYSTEM_PROMPT}

다음 NEXUS 포트폴리오 데이터를 분석해주세요:

\`\`\`json
${JSON.stringify(portfolioData, null, 2)}
\`\`\``;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Freedom API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
