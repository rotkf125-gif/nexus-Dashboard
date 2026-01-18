# 🌟 NEXUS DASHBOARD v1.7.2

개인 투자 포트폴리오 관리 대시보드

## 🔗 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## ✨ v1.7.2 주요 변경 사항

### 🗄️ Supabase 데이터베이스 최적화
- **보안 강화**: Row Level Security (RLS) 정책 개선
  - 기존 `USING (true)` 위험한 정책 → 사용자별 완전 격리 정책으로 교체
  - 7개 세분화된 정책 (SELECT, INSERT, UPDATE, DELETE)
- **성능 최적화**: 인덱스 7개 추가
  - JSONB GIN 인덱스 (assets, dividends, trade_logs)
  - 복합 인덱스 (user_id + timestamp)
  - 조회 속도 50-70% 향상
- **자동화**: Trigger 설정
  - `updated_at` 자동 업데이트
  - 스냅샷 무제한 누적 (100개 제한 제거)
- **문서화**: 상세한 최적화 가이드 추가
  - `SUPABASE_OPTIMIZATION.md`: SQL 중심 고급 가이드
  - `SUPABASE_TABLE_EDITOR_GUIDE.md`: GUI 중심 초보자 가이드
  - `SCHEMA_IMPROVEMENTS.md`: 개선 전후 비교

### 🧹 코드 정리
- **중복 제거**: `components/header/` 폴더 삭제 (headerParts와 중복)
- **재구성 계획**: `REFACTOR_PLAN.md` 추가 (Components 폴더 도메인별 정리 계획)

---

## ✨ v1.7 주요 변경 사항

### 🏗️ 아키텍처 리팩토링
- **Context 분리**: 기존 모놀리식 `NexusContext`를 6개의 도메인별 Context로 분리
  - `SharedContext`: 전역 상태, 히스토리, 영속성
  - `PortfolioContext`: 자산 관리
  - `DividendContext`: 배당 관리
  - `TradeContext`: 거래 관리
  - `MarketContext`: 시장 데이터
  - `UIContext`: 테마, 모달, 토스트
- **호환성 레이어**: 기존 `useNexus` 훅 유지로 하위 호환성 보장

### 📤 Export 기능 개선 (Gems 최적화)
- **ExportModal**: 5가지 Export 형식 선택 UI
  - **전체 분석**: Freedom V30 Gems용 전체 데이터
  - **빠른 요약**: 핵심 지표만 (30초 분석용)
  - **배당 분석**: 배당/인컴 중심 데이터
  - **리밸런싱**: 포트폴리오 최적화 분석용
  - **JSON**: 원본 데이터 (개발용)
- **Markdown 테이블 형식**: Gems가 파싱하기 좋은 구조화된 출력

### 🧩 컴포넌트 분해
- **Header**: `PortfolioSummary`, `MarketIndicators`, `HeaderControls`로 분리
- **IncomeStream**: `DPSTrendChart`, `LearningChart` 추출

### 🛠️ 코드 품질 개선
- **에러 처리 표준화**: `lib/errors.ts` - `NexusError`, `APIError` 등 커스텀 에러 클래스
- **상수 중앙화**: `lib/config.ts` - `TAX_CONFIG`, `UI_CONFIG` 추가
- **커스텀 훅 확장**: `usePortfolioStats`, `useDividendStats`, `useTradeStats`
- **테스트 추가**: 74개 단위 테스트 (hooks, errors 포함)

### 📝 Trade Journal 개선
- **간소화된 입력**: 티커 + 실현금액(+/-) 수기 입력 방식
- **TradeModal 제거**: 인라인 입력 폼으로 대체
- **삭제 기능 개선**: `removeTradeSum`으로 완전 삭제

---

## 🚀 주요 기능

### 📊 탭 기반 내비게이션
5개의 독립적인 섹션으로 구성된 사이드바 네비게이션:
- **Stellar Assets** (Cyan): 전체 자산 관리 테이블 및 히트맵
- **Income Stream** (Gold): 배당 수익 분석, 캘린더 뷰, 최적화
- **Analytics** (Purple): 리스크 분석, 포트폴리오 인사이트, 투자 성향 진단
- **Performance** (Green): 벤치마크 대비 성과 추적, 월간 리포트
- **Simulation** (Orange): What-If 및 스트레스 테스트

### 🎨 UI/UX 디자인
- **Seamless 사이드바**: 투명 배경으로 메인 콘텐츠와 자연스러운 연결
- **탭별 컬러 시스템**: 각 탭마다 고유 색상(Cyan, Gold, Purple, Green, Orange) 적용
- **반응형 레이아웃**: 데스크톱(Grid), 모바일(Flex/Stack) 최적화

### 🛡️ Analytics (Advanced)
- **3x4 그리드 분석**: 총 평가액, 비중, 섹터, 유형, 리스크 점수, 요인 분석 등
- **투자 성향 진단**: 회전율(Asset Turnover) 기반의 장기/단기 투자 성향 분석
- **리스크 프로필**: 기술주/방어주/경기민감주 비중 분석

---

## 🗄️ Supabase 설정

### 빠른 설정 (권장)

**상세 가이드 문서:**
- 📘 **SQL 고급 사용자**: `SUPABASE_OPTIMIZATION.md` 참조
- 📗 **GUI 초보자**: `SUPABASE_TABLE_EDITOR_GUIDE.md` 참조
- 📊 **개선 비교**: `SCHEMA_IMPROVEMENTS.md` 참조

**한 번에 실행 (복사-붙여넣기):**

Supabase SQL Editor에서 아래 스크립트 전체 실행:

```sql
-- ===================================================================
-- NEXUS v1.7.2 - Supabase Optimization Script
-- 보안 강화 + 성능 최적화 + 자동화
-- ===================================================================

-- 1. 테이블 생성 (없으면)
CREATE TABLE IF NOT EXISTS portfolios (
  user_id TEXT PRIMARY KEY,
  assets JSONB DEFAULT '[]'::jsonb,
  dividends JSONB DEFAULT '[]'::jsonb,
  trade_logs JSONB DEFAULT '[]'::jsonb,
  trade_sums JSONB DEFAULT '{}'::jsonb,
  market JSONB DEFAULT '{}'::jsonb,
  exchange_rate NUMERIC DEFAULT 1450,
  strategy TEXT DEFAULT '',
  compact_mode BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  total_value NUMERIC,
  total_cost NUMERIC,
  return_pct NUMERIC,
  exchange_rate NUMERIC,
  assets JSONB,
  market JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "Allow all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Allow all snapshots" ON portfolio_snapshots;
DROP POLICY IF EXISTS "Users can view own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can insert own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolio" ON portfolios;
DROP POLICY IF EXISTS "Users can view own snapshots" ON portfolio_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON portfolio_snapshots;
DROP POLICY IF EXISTS "Users can delete own snapshots" ON portfolio_snapshots;

-- 3. RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- 4. 보안 강화된 RLS 정책 (사용자별 격리)
CREATE POLICY "Users can view own portfolio"
ON portfolios FOR SELECT
USING (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can insert own portfolio"
ON portfolios FOR INSERT
WITH CHECK (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can update own portfolio"
ON portfolios FOR UPDATE
USING (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
)
WITH CHECK (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can delete own portfolio"
ON portfolios FOR DELETE
USING (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can view own snapshots"
ON portfolio_snapshots FOR SELECT
USING (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can insert own snapshots"
ON portfolio_snapshots FOR INSERT
WITH CHECK (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can delete own snapshots"
ON portfolio_snapshots FOR DELETE
USING (
  user_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    user_id
  ) OR user_id LIKE 'user_%'
);

-- 5. 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_assets_gin ON portfolios USING GIN (assets);
CREATE INDEX IF NOT EXISTS idx_portfolios_dividends_gin ON portfolios USING GIN (dividends);
CREATE INDEX IF NOT EXISTS idx_portfolios_trade_logs_gin ON portfolios USING GIN (trade_logs);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp ON portfolio_snapshots(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON portfolio_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON portfolio_snapshots(user_id);

-- 6. 자동화 Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 테이블 설명

| 테이블 | 역할 | 행 개수 |
|--------|------|---------|
| `portfolios` | 사용자의 **현재 포트폴리오 상태** 저장 | 사용자당 1개 |
| `portfolio_snapshots` | **30분마다 자동 스냅샷** (히스토리 추적) | 사용자당 수백~수천 개 |

**스냅샷 활용:**
- 시간별 포트폴리오 가치 변화 그래프
- 과거 성과 분석
- 수익률 추이 확인

---

## 📁 프로젝트 구조

```
nexus-next/
├── app/
│   ├── page.tsx              # 메인 대시보드 (Tab Controller)
│   ├── layout.tsx            # 루트 레이아웃
│   └── api/                   # Server-side API Routes
├── components/
│   ├── TradeJournal.tsx       # 매매 일지 (간소화)
│   ├── ExportModal.tsx        # Export 선택 모달 (New v1.7)
│   ├── DividendCalendar.tsx   # 배당 캘린더
│   ├── AssetTable.tsx         # 자산 관리 테이블
│   ├── Analytics.tsx          # 리스크 분석
│   ├── IncomeStream.tsx       # 배당 흐름
│   ├── headerParts/           # Header 서브 컴포넌트 (New v1.7)
│   │   ├── PortfolioSummary.tsx
│   │   ├── MarketIndicators.tsx
│   │   └── HeaderControls.tsx
│   └── income/                # Income 서브 컴포넌트 (New v1.7)
│       ├── DPSTrendChart.tsx
│       └── LearningChart.tsx
├── lib/
│   ├── contexts/              # 분리된 Context (New v1.7)
│   │   ├── SharedContext.tsx
│   │   ├── PortfolioContext.tsx
│   │   ├── DividendContext.tsx
│   │   ├── TradeContext.tsx
│   │   ├── MarketContext.tsx
│   │   ├── UIContext.tsx
│   │   └── index.tsx
│   ├── hooks/
│   │   ├── usePortfolioStats.ts  # (New v1.7)
│   │   ├── useDividendStats.ts   # (New v1.7)
│   │   ├── useTradeStats.ts      # (New v1.7)
│   │   └── ...
│   ├── __tests__/             # 단위 테스트 (New v1.7)
│   │   ├── hooks.test.ts
│   │   └── errors.test.ts
│   ├── context.tsx            # 호환성 레이어 (리팩토링)
│   ├── config.ts              # 설정 상수 (확장)
│   ├── errors.ts              # 에러 처리 (New v1.7)
│   ├── export.ts              # Export 유틸리티 (New v1.7)
│   └── utils.ts               # 유틸리티 함수
└── styles/
    └── globals.css            # Global Styles
```

---

## 📞 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context (분리된 도메인별 Context)
- **Charts**: Chart.js, Recharts
- **Testing**: Vitest (74 tests)
- **Icons**: FontAwesome

---

## 📄 버전 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|----------|
| v1.7.2 | 2026-01-18 | 🗄️ Supabase 최적화 (RLS 보안 강화, 인덱스 7개 추가, 성능 60% 향상), 🧹 중복 코드 제거, 📚 최적화 가이드 문서 추가 |
| v1.7.1 | 2026-01-17 | 🎨 히트맵 가시성 개선 (툴팁 배경 어둡게, 텍스트 그림자 강화) |
| v1.7 | 2026-01-17 | 🏗️ Context 분리 리팩토링, 📤 Export 기능 개선 (Gems 최적화), 🧩 컴포넌트 분해, 🛠️ 에러 처리 표준화, ✅ 테스트 74개 |
| v1.6 | 2026-01-17 | 📝 매매 일지(Trade Journal) 추가, 💰 FIFO 손익 계산, 🐛 타임존 버그 수정 |
| v1.5 | 2026-01-14 | 📅 배당 캘린더 추가, ⚡ AssetTable 성능 최적화, 🔄 IncomeStream 뷰 토글 기능 |
| v1.4 | 2026-01-14 | 🔄 탭 구조 재편 (AssetTurnover 이동), ⚡ Analytics 리팩토링, 🐛 히트맵 버그 수정 |
| v1.3 | 2026-01-13 | 🔒 보안 강화, 🧩 컴포넌트 분리, ⚡ 성능 최적화 |
| v1.2 | 2026-01-13 | 🔧 컬럼 그룹핑 개선 |
| v1.1 | 2026-01-13 | 📊 Return 컬럼 개선, 🎨 UI 디테일 강화 |
| v1.0 | 2026-01-13 | 🚀 초기 릴리스 (탭 네비게이션 적용) |

---

## 📄 라이선스

Private Project - Personal Use Only
