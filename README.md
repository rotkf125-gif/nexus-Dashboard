# 🌟 NEXUS CELESTIAL V65.9 - Next.js Edition

개인 투자 포트폴리오 대시보드 (Celestial Glass 테마)

## 🔗 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## ✨ V65.9 변경 사항

### 📊 Stellar Assets 테이블 통합 리디자인
- **Compact 레이아웃 통합**: 기본/Compact 모드 통합, 단일 레이아웃으로 일원화
- **열 순서 최적화**: Ticker → Qty → Return → Avg → Price → Val($) → Val(₩) → FX Rate → FX P/L
- **균등 열 간격**: `table-fixed` + `colgroup`으로 열 너비 균등 배분
- **P/L 통합 표시**: Val($)에 손익($) 포함, Val(₩)에 손익(₩) 포함
- **텍스트 크기 최적화**: 헤더 `text-[8px]`, 셀 `text-[10px]`
- **섹터 표시 간소화**: 섹터 이모지만 표시 (라벨 제거)
- **액션 버튼 미니화**: `w-5 h-5` 미니 아이콘 버튼

---

## ✨ V65.8 변경 사항

### 🔧 Analytics 정확도 개선
- **`/api/info/[ticker]` API 신규**: Yahoo Finance chart API 기반 종목 정보 조회
- **TICKER_SECTOR_MAP 확장**: 200+ 종목 섹터 매핑 (Technology, Finance, Healthcare 등)
- **ETF_SECTOR_DATA 확장**: QDTE 등 신규 ETF 섹터 비중 추가
- **AssetModal 섹터 자동 조회**: 티커 입력 시 섹터/이름 자동 조회

---

## ✨ V65.7 변경 사항

### 📐 Income Stream 텍스트 크기 최적화
- **Income 카드 (PLTY, QDTE)**
  - 티커명: `text-lg` → `text-base` (16px)
  - Total Return 배지: `text-xs` → `text-[11px]`, 패딩 축소
  - 라벨(QTY, DIVIDEND 등): `text-[10px]`, 투명도 50%
  - 값 크기 세분화: `text-[12px]~text-[13px]`
  - 레이아웃 변경: 수직 → 수평 `flex items-baseline` (공간 효율화)
  - Recovery 바: `h-2.5` → `h-2`

- **Weekly Summary & Recent Logs**
  - 라벨 크기: `text-[11px]` → `text-[10px]`
  - 설명 텍스트: `text-[9px]` → `text-[8px]`
  - 금액 표시: `text-xl` → `text-lg`
  - Recent Logs 열 정렬: 고정 너비 적용 (`w-16`, `w-12`, `w-14`)

- **Analytics 섹션**
  - 섹션 제목: `text-[12px]` → `text-[11px]`
  - 범례 점: `w-2 h-2` → `w-1.5 h-1.5`
  - AVG 카드 라벨: `text-[10px]` → `text-[9px]`
  - Learning Stats: `text-[9px]` → `text-[8px]`

---

## ✨ V65.6 변경 사항

### 🎨 Analytics 컴포넌트 전면 개편
- **3행 x 4열 그리드 레이아웃**으로 재구성
- **Row 1**: Total Value (도넛 차트), Weight (바 그래프), Sector (도넛 차트), Type (CORE/INCOME 차트)
- **Row 2**: Risk Score (반원 게이지), Risk Factors (4지표 막대 시각화), Performance (TOP/BTM 순위)
- **Row 3**: Market Correlation (S&P/NASDAQ 상관계수), Risk Profile (태그 버튼), Insight (분석 리스트)

### 🎯 사이드바 네비게이션 개선
- **텍스트 크기 확대**: text-[10px] → text-sm (14px)
- **아이콘 크기 확대**: text-[10px] → text-sm
- **탭별 고유 색상** hover 효과:
  - Stellar Assets: Cyan (핵심 자산)
  - Income Stream: Gold (배당/수익)
  - Analytics: Purple (분석/리스크)
  - Performance: Green (성과/수익률)
  - Simulation: Orange (시뮬레이션/실험)

### 🔧 파일 리네이밍
- `RiskAnalytics.tsx` → `Analytics.tsx`

---

## ✨ V65.5 변경 사항

### 👁️ 가독성 대폭 개선
- **텍스트 크기 증가**: text-[8-9px] → text-[10-12px]
- **Opacity 증가**: 40/50/60 → 80/90 (더 밝은 텍스트)
- **라벨/설명 가시성 향상**: text-white/40 → text-white/80

### 📊 차트 & 게이지 확대
- **Star Core 도넛 차트**: 120x120 → 155x155 (박스의 86% 채움)
- **Risk Analytics 게이지**: 180x110 → 200x125
- **Sector 차트**: 60x60 → 75x75
- **진행 바 높이**: h-1.5 → h-2

### 📐 레이아웃 변경
- **DPS Trend + Learning**: 좌우 배치 → 상하 배치 (세로 레이아웃)
- **Risk Analytics 박스**: 모든 섹션 균등 높이 (min-h-[180px])
- **INSIGHT 영역 확대**: 패딩 p-3 → p-4

### 🎯 컴포넌트별 개선
- **StarCore**: TOTAL VALUE 텍스트 확대 (text-xl → text-2xl)
- **Sidebar**: Weight, Sector, Type, Rankings 박스 전체 텍스트 확대
- **IncomeStream**: QTY, DIVIDEND, PRINCIPAL 라벨 text-[12px]
- **RiskAnalytics**: Risk Factors, Sector Exposure 텍스트 확대

---

## ✨ V65.4 변경 사항

### 📐 Stellar Assets 레이아웃 재구성
- **Star Core 크기 최적화**: 320x320 → 180x180
- **1/4 + 3/4 세로 분할**: Star Core + Sidebar (상단 1/4) / Asset Table (하단 3/4)
- **가로 배치 최적화**: Star Core와 Sidebar가 나란히 배치

---

## ✨ V65.3 변경 사항

### 📐 레이아웃 최적화
- **메인 그리드 높이 동기화**: Assets 섹션과 오른쪽 열(Simulation + Risk Analytics) 높이 일치
- **박스 균등 분배**: Simulation Hub와 Risk Analytics가 공간을 균등하게 나눠 사용
- **스크롤 영역 개선**: 각 박스 내부에서 독립적 스크롤 지원
- **홈페이지 길이 최적화**: 불필요한 세로 공간 제거

### 🔧 구조 변경
- `page.tsx`: 메인 그리드에 `items-stretch` 적용
- `RiskAnalytics.tsx`: `h-full flex flex-col` + 스크롤 컨테이너 추가

---

## ✨ V65.2 신규 기능

### 📈 Historic Performance
- **30분 스냅샷 기반** 포트폴리오 변화 라인 차트
- 기간 선택: **24시간 / 1주 / 1개월**
- 듀얼 Y축: 총 자산(좌측) + 수익률%(우측)
- 기간별 변화량 및 변화율 표시

### 🛡️ Risk Analytics (Risk Score + Correlation 통합)
- **반원 게이지**로 종합 리스크 점수 (0-100) 시각화
- 4가지 요인별 점수 바:
  - 분산도 (HHI 기반)
  - 섹터 집중도
  - VIX 변동성
  - 단일 종목 집중도
- 리스크 레벨: LOW / MODERATE / HIGH / EXTREME
- 기존 Sector Exposure, Market Correlation, Risk Profile 유지
- **SimulationHub와 별도 박스로 분리**

### 📱 Widget Mode (Android)
- **API Endpoint**: `GET /api/widget?uid=xxx`
- Tasker / KWGT 호환 JSON 응답
- 응답 데이터: totalValue, totalValueKRW, todayReturnPct, topHoldings
- Settings에서 UID/API URL 복사 기능
- CORS 지원

### 🔧 구조 변경
- `SimulationHub`: 3탭 → 2탭 (What-If, Rebalance)
- `CorrelationInsight.tsx` → `RiskAnalytics.tsx`로 통합
- 새 타입 추가: HistoricPeriod, RiskMetrics, RiskLevel, WidgetData

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

### 🎯 Simulation Hub (2탭)
- **What-If**: 추가 매수 시뮬레이션
- **Rebalance**: 목표 비중 설정 및 매수/매도 제안

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
│       ├── widget/route.ts   # Android Widget API
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
│   ├── SimulationHub.tsx     # 시뮬레이션 탭 (What-If, Rebalance)
│   ├── WhatIfSimulator.tsx   # What-If
│   ├── RebalanceSimulator.tsx# 리밸런싱
│   ├── Analytics.tsx         # Analytics (Risk Score + 상관관계 분석)
│   ├── PerformanceArena.tsx  # 벤치마크 비교
│   ├── HistoricPerformance.tsx # 히스토릭 퍼포먼스 차트
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

### GET /api/widget?uid=xxx
Android Tasker/KWGT 위젯용 API
```json
{
  "timestamp": 1704412800000,
  "totalValue": 12500.50,
  "totalValueKRW": 18125725,
  "todayReturn": 125.30,
  "todayReturnPct": 1.01,
  "topHoldings": [
    { "ticker": "PLTY", "value": 5200, "returnPct": 2.5 },
    { "ticker": "HOOY", "value": 3800, "returnPct": 1.2 },
    { "ticker": "SPY", "value": 3500, "returnPct": 0.8 }
  ],
  "marketState": "REGULAR",
  "exchangeRate": 1450
}
```

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
| V65.9 | 2026-01-12 | Stellar Assets 테이블 통합 리디자인, 균등 열 간격 |
| V65.8 | 2026-01-12 | Analytics 정확도 개선, /api/info API, TICKER_SECTOR_MAP 확장 |
| V65.7 | 2026-01-11 | Income Stream 텍스트 크기 최적화, 카드 레이아웃 개선 |
| V65.6 | 2025-01-11 | Analytics 전면 개편 (3x4 그리드), 사이드바 탭별 색상, 텍스트 확대 |
| V65.5 | 2025-01-11 | 가독성 대폭 개선 (텍스트/차트 확대, opacity 증가, DPS+Learning 세로 배치) |
| V65.4 | 2025-01-11 | Stellar Assets 레이아웃 재구성 (1/4+3/4 분할) |
| V65.3 | 2025-01-05 | 레이아웃 최적화 (Assets/Simulation/Risk 높이 동기화) |
| V65.2 | 2025-01-05 | Historic Performance, Risk Analytics (Risk Score + Correlation 통합), Widget API (Android) |
| V65.1 | 2025-01-03 | 실시간 벤치마크, 섹터 분산도 기반 상관관계 |
| V65.0 | 2025-01-02 | SimulationHub, PerformanceArena, Type그룹화, KST Market State, 30분 스냅샷 |
| V64.2 | 2024-12 | Celestial Glass 테마, Supabase 연동 |

---

## 📄 라이선스

Private Project - Personal Use Only
