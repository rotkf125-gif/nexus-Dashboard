# 🌟 NEXUS CELESTIAL V65.2 - Next.js Edition

개인 투자 포트폴리오 대시보드 (Celestial Glass 테마)

## 🔗 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## ✨ V65.2 코드 아키텍처 최적화

### 🏗️ 구조 개선
- **lib/utils.ts**: 공통 유틸리티 함수 분리 (formatUSD, calculatePortfolioStats 등)
- **lib/hooks/**: 커스텀 훅 폴더 신규 생성
  - `usePortfolio.ts`: 포트폴리오 계산 로직
  - `useModal.ts`: 모달 상태 관리
  - `useToast.ts`: 토스트 알림
  - `usePriceRefresh.ts`: 가격 새로고침 로직

### 📦 타입 시스템 강화
- API 응답 타입 추가 (PriceResponse, BenchmarkResponse 등)
- 컴포넌트 Prop 타입 정의 (ModalProps, AssetModalProps)
- 시뮬레이션 타입 (WhatIfScenario, RebalanceTarget, CorrelationData)

### ⚙️ 설정 중앙화
- `TYPE_ORDER`, `TYPE_INFO` config로 이동
- `API_ENDPOINTS` 상수화
- `REFRESH_INTERVALS` 설정
- `getVixLevel()`, `getChartColor()` 헬퍼 함수

### 🔧 컴포넌트 최적화
- StarCore.tsx: utils/config import 적용
- AssetTable.tsx: 중복 TYPE_INFO 제거
- PerformanceArena.tsx: API_ENDPOINTS 활용

---

## ✨ V65.1 신규 기능

### 📊 Performance Arena - 실시간 벤치마크
- Yahoo Finance 1년 차트 기반 **실시간 YTD 수익률** 계산
- SPY, QQQ, DIA, IWM 벤치마크 vs 포트폴리오 비교
- 연초 가격 / 현재 가격 표시
- 새로고침 버튼으로 최신 데이터 갱신

### 🔗 Correlation Insight - 섹터 분산도 기반
- **ETF별 실제 섹터 구성** 데이터 내장 (PLTY, HOOY, QYLD, JEPI, SCHD 등)
- **Diversification Score**: HHI 기반 분산도 점수 (0~100)
- **Sector Exposure**: 포트폴리오 전체 섹터 비중 시각화
- **Market Correlation**: S&P500/NASDAQ와의 상관계수 계산
- **Risk Profile**: 성장주/방어주/경기민감주 비중 분석

### 📈 Income Stream - EST.WEEKLY 개선
- 기존: 과거 배당 평균 (고정 수량)
- **변경: 현재 보유 수량 × 최근 6개 DPS 평균 × 세후 85%**

### 📊 Dividend Analytics - 레이아웃 개선
- 기존: DPS TREND / LEARNING 탭 전환
- **변경: 좌우 반반 동시 표시**

### 🗑️ 레거시 파일 정리
- `DPSTrend.tsx`, `Learning.tsx` 삭제 (DividendAnalytics에 통합됨)
- 모든 파일 버전 주석 V65.1 업데이트

---

## ✨ V65.0 신규 기능

### 🎯 Simulation Hub (3탭 통합)
- **What-If**: 추가 매수 시뮬레이션
- **Rebalance**: 목표 비중 설정 및 매수/매도 제안
- **Correlation**: 시장 요인별 상관관계 분석 (NASDAQ, S&P500, VIX, US10Y, USD/KRW)

### 📊 Performance Arena
- 포트폴리오 vs 벤치마크 비교 (SPY, QQQ, DIA, IWM)
- Alpha 계산 (시장 초과 수익률)
- 랭킹 시스템

### 🔮 Predicted Dividend
- 과거 DPS 기반 다음 배당금 예측
- 이동평균 기반 트렌드 분석
- 신뢰도 표시

### 📈 Market State (KST)
- 한국 시간 기준 거래장 표시
- 서머타임(DST) / 표준시(STD) 자동 전환
- 프리마켓/정규장/애프터마켓/주간거래/휴장 상태

| 상태 | 서머타임 (KST) | 표준시 (KST) |
|------|---------------|--------------|
| 🔵 프리마켓 | 17:00 - 22:30 | 18:00 - 23:30 |
| 🟢 정규장 | 22:30 - 05:00 | 23:30 - 06:00 |
| 🟣 애프터 | 05:00 - 07:00 | 06:00 - 08:00 |
| 🟠 주간거래 | 10:00 - 17:00 | 10:00 - 17:00 |

### 📋 Asset Type 그룹화
- Type별 자산 그룹화 (접이식)
- 순서: CORE → GROWTH → VALUE → SPECULATIVE → INCOME
- Type별 총 평가금/수익률 표시

### 💾 스냅샷 히스토리
- 30분 간격 자동 저장
- 시간별 포트폴리오 추적
- portfolio_snapshots 테이블

### 📤 Freedom Export 개선
- assets: valueUsd/valueKrw/fxRate/fxPL 추가
- incomeStream: 배당 분석 데이터 통합
- summary: 포트폴리오 요약 구조화

---

## ✅ 구현 완료 기능

### 🔐 인증 & 동기화
- [x] Supabase 연동 (클라우드 데이터 저장)
- [x] Google OAuth 로그인
- [x] 이메일/비밀번호 로그인
- [x] URL 파라미터 공유 (`?uid=xxx`)
- [x] 모바일 동기화 지원

### 📊 대시보드
- [x] 실시간 주가 조회 (Yahoo Finance)
- [x] 24시간 시세 (프리/정규/애프터/선물)
- [x] 주요 지수 (NASDAQ, S&P500, VIX, US10Y, USD/KRW)
- [x] 거래장 상태 표시 (KST + DST)
- [x] 평가금/원금/수익금 표시
- [x] Star Core 도넛 차트
- [x] Sidebar 차트 (Weight, Sector, Type, Rankings)

### 📈 자산 관리
- [x] Type별 그룹화 테이블
- [x] 자산 추가/수정/삭제 모달
- [x] 드래그 앤 드롭 정렬
- [x] Compact 모드
- [x] Delta 지표 (가격 변동 표시)

### 💰 배당 관리
- [x] Income Stream 카드 (Total Return 계산)
- [x] Trade Return 입력
- [x] Recovery 진행률
- [x] Predicted Dividend (다음 배당 예측)
- [x] Google Sheets 동기화
- [x] Dividend Analytics (DPS Trend + Learning)

### 🧪 시뮬레이션
- [x] What-If Simulator
- [x] Rebalance Simulator
- [x] Correlation Insight
- [x] Performance Arena (벤치마크 비교)

### ⚙️ 설정
- [x] Strategy & Plan (자동 저장)
- [x] 환율 수동 설정
- [x] API 갱신 주기 설정
- [x] Freedom Export (AI 분석용)
- [x] 데이터 Export/Import (JSON)
- [x] 30분 스냅샷 히스토리

---

## 📁 프로젝트 구조

```
nexus-next/
├── app/
│   ├── page.tsx              # 메인 대시보드
│   ├── layout.tsx            # 루트 레이아웃
│   └── api/
│       ├── market/route.ts   # 지수 API (24H)
│       ├── benchmark/route.ts# 벤치마크 API
│       └── price/[ticker]/route.ts
├── components/
│   ├── Header.tsx            # 헤더 (Auth, Market State)
│   ├── AuthModal.tsx         # 로그인/회원가입
│   ├── AssetTable.tsx        # Type별 그룹화 테이블
│   ├── AssetModal.tsx        # 자산 추가/수정
│   ├── IncomeStream.tsx      # 배당 수익 카드
│   ├── PredictedDividend.tsx # 배당 예측
│   ├── DividendAnalytics.tsx # DPS + Learning 통합
│   ├── DividendModal.tsx     # 배당 기록
│   ├── SimulationHub.tsx     # 시뮬레이션 탭 컨테이너
│   ├── WhatIfSimulator.tsx   # What-If
│   ├── RebalanceSimulator.tsx# 리밸런싱
│   ├── CorrelationInsight.tsx# 상관관계 분석
│   ├── PerformanceArena.tsx  # 벤치마크 비교
│   ├── SettingsModal.tsx     # 설정 (Export/Import)
│   ├── Sidebar.tsx           # 차트 사이드바
│   ├── StarCore.tsx          # 도넛 차트
│   └── StrategyBar.tsx       # 전략 메모
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── storage.ts            # 하이브리드 스토리지 + 스냅샷
│   ├── context.tsx           # 전역 상태 관리
│   ├── types.ts              # TypeScript 타입 (API/컴포넌트)
│   ├── config.ts             # 설정 상수 + 헬퍼 함수
│   ├── utils.ts              # 공통 유틸리티 함수
│   └── hooks/                # 커스텀 훅
│       ├── index.ts
│       ├── usePortfolio.ts   # 포트폴리오 계산
│       ├── useModal.ts       # 모달 상태 관리
│       ├── useToast.ts       # 토스트 알림
│       └── usePriceRefresh.ts# 가격 새로고침
└── styles/
    └── globals.css           # Celestial Glass 테마
```

---

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. 개발 서버 실행
```bash
npm run dev
```
http://localhost:3000 접속

### 4. 프로덕션 빌드
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase 설정

### 테이블 생성 (SQL Editor)
```sql
-- 1. 메인 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS portfolios (
  user_id TEXT PRIMARY KEY,
  assets JSONB DEFAULT '[]',
  dividends JSONB DEFAULT '[]',
  trade_sums JSONB DEFAULT '{}',
  market JSONB DEFAULT '{}',
  exchange_rate NUMERIC DEFAULT 1450,
  strategy TEXT DEFAULT '',
  compact_mode BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 스냅샷 히스토리 테이블
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_value NUMERIC,
  total_cost NUMERIC,
  return_pct NUMERIC,
  exchange_rate NUMERIC,
  assets JSONB,
  market JSONB
);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_snapshots_user_time 
ON portfolio_snapshots(user_id, timestamp DESC);

-- 4. RLS 정책
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all portfolios" ON portfolios;
CREATE POLICY "Allow all portfolios" ON portfolios
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all snapshots" ON portfolio_snapshots;
CREATE POLICY "Allow all snapshots" ON portfolio_snapshots
  FOR ALL USING (true) WITH CHECK (true);
```

### Google OAuth 설정
1. Supabase Dashboard → Authentication → Providers → Google
2. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
3. Redirect URI: `https://xxx.supabase.co/auth/v1/callback`

---

## 🔧 API Routes

### GET /api/price/[ticker]
```json
{
  "ticker": "AAPL",
  "price": 178.52,
  "previousClose": 177.30,
  "change": 1.22,
  "changePercent": 0.69,
  "marketState": "REGULAR"
}
```

### GET /api/market
```json
{
  "nasdaq": 19500,
  "sp500": 6000,
  "vix": 14.20,
  "tnx": 4.25,
  "krw": 1435,
  "marketState": "REGULAR",
  "sources": {
    "nasdaq": "spot",
    "sp500": "futures"
  }
}
```

**marketState 값:**
- `PRE`: 프리마켓
- `REGULAR`: 정규장
- `POST`: 애프터마켓
- `CLOSED`: 장 마감

---

## 📤 Freedom Export 데이터 구조

```json
{
  "timestamp": "2025-01-02T15:30:00.000Z",
  "summary": {
    "totalValue": 12500.50,
    "totalCost": 11200.00,
    "returnPct": 11.61,
    "totalValueKrw": 18125725,
    "exchangeRate": 1450
  },
  "assets": [
    {
      "ticker": "PLTY",
      "qty": 100,
      "avg": 27.22,
      "price": 25.78,
      "valueUsd": 2577.50,
      "valueKrw": 3737375,
      "fxRate": 1450,
      "fxPL": 0,
      "type": "INCOME",
      "sector": "ETF"
    }
  ],
  "incomeStream": {
    "assets": [
      {
        "ticker": "PLTY",
        "principal": 2722.81,
        "dividend": 1120.67,
        "valuation": 2577.50,
        "tradeReturn": -1002.78,
        "totalReturn": -27.42,
        "recoveryPct": 41.2,
        "predictedDps": 0.63,
        "dividendCount": 15
      }
    ],
    "weeklyAvg": 69.91,
    "totalDividend": 2091.90
  },
  "market": {
    "nasdaq": 19850,
    "sp500": 6020,
    "vix": 15.5,
    "tnx": 4.25,
    "krw": 1450,
    "marketState": "REGULAR"
  }
}
```

---

## 📱 모바일 동기화

### 방법 1: URL 공유
1. PC에서 👤 아이콘 클릭
2. 하단 "모바일 공유 링크" 복사
3. 모바일에서 해당 링크 접속

### 방법 2: Google 로그인
1. PC/모바일 모두 같은 Google 계정으로 로그인
2. 자동 동기화

---

## 🎨 테마 커스터마이징

### Tailwind 색상 (`tailwind.config.js`)
```javascript
colors: {
  'celestial-cyan': '#00d4ff',
  'celestial-gold': '#ffd700',
  'celestial-purple': '#b388ff',
  'v64-success': '#69F0AE',
  'v64-danger': '#FF5252',
  'v64-warning': '#FFD740',
}
```

---

## 📝 Git 명령어

```bash
# 변경사항 커밋 & 푸시
git add .
git commit -m "V65.0: 커밋 메시지"
git push origin main

# Vercel 자동 배포됨
```

---

## 🆘 문제 해결

### npm install 오류
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Vercel 빌드 실패
- Vercel Dashboard → Deployments → Build Logs 확인
- TypeScript 타입 오류 수정

### Supabase 연결 실패
- 환경 변수 확인 (NEXT_PUBLIC_ 접두사 필수)
- Vercel에서 환경 변수 설정 후 Redeploy

---

## 📞 기술 스택

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Charts**: Chart.js
- **Hosting**: Vercel
- **API**: Yahoo Finance

---

## 📄 버전 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|----------|
| V65.2 | 2025-01-04 | 코드 아키텍처 최적화, utils/hooks 분리, 타입 시스템 강화 |
| V65.1 | 2025-01-03 | 실시간 벤치마크, 섹터 분산도 기반 상관관계 |
| V65.0 | 2025-01-02 | SimulationHub, PerformanceArena, Type그룹화, KST Market State, 30분 스냅샷 |
| V64.2 | 2024-12 | Celestial Glass 테마, Supabase 연동 |

---

## 📄 라이선스

Private Project - Personal Use Only
