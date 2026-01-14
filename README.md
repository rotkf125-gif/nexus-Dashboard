# 🌟 NEXUS DASHBOARD v1.4

개인 투자 포트폴리오 관리 대시보드

## 🔗 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## ✨ v1.4 주요 변경 사항

### 🔄 탭 구조 재편 (Refined Tab Architecture)
- **Income 탭 정제**: 순수 배당 및 현금흐름 분석에 집중하도록 `AssetTurnover` 제거.
- **Analytics 탭 강화**: 리스크 분석과 투자 성향 진단을 결합. `AssetTurnover`를 이동시키고 `RebalanceSuggestion`과 나란히 배치하여 기술적/행동적 분석을 통합.

### ⚡ 코드 최적화 (Optimization)
- **Analytics 리팩토링**: 거대한 하드코딩 데이터(`ETF_SECTOR_DATA` 등)를 `lib/market-data.ts`로 분리하여 가독성 및 유지보수성 향상.
- **로직 분리**: 복잡한 리스크 계산 로직을 `lib/hooks/useRiskAnalytics.ts` 커스텀 훅으로 추출.

### 🐛 안정성 강화 (Bug Fixes)
- **PortfolioHeatmap**: 데이터 로딩 중 발생할 수 있는 `returnPct` undefined 오류 수정 및 방어 코드 추가.

---

## 🚀 주요 기능

### 📊 탭 기반 내비게이션
5개의 독립적인 섹션으로 구성된 사이드바 네비게이션:
- **Stellar Assets** (Cyan): 전체 자산 관리 테이블 및 히트맵
- **Income Stream** (Gold): 배당 수익 분석 및 최적화
- **Analytics** (Purple): 리스크 분석, 포트폴리오 인사이트, 투자 성향 진단
- **Performance** (Green): 벤치마크 대비 성과 추적 및 월간 리포트
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

---

## 📁 프로젝트 구조

```
nexus-next/
├── app/
│   ├── page.tsx              # 메인 대시보드 (Tab Controller)
│   ├── layout.tsx            # 루트 레이아웃
│   └── api/                  # Server-side API Routes
├── components/
│   ├── Analytics.tsx         # 리스크 분석 (Refactored)
│   ├── AssetTable.tsx        # 자산 관리 테이블
│   ├── AssetTurnover.tsx     # 회전율/성향 분석
│   ├── IncomeStream.tsx      # 배당 흐름
│   ├── PortfolioHeatmap.tsx  # 트리맵 시각화
│   └── ...
├── lib/
│   ├── hooks/
│   │   ├── usePortfolio.ts
│   │   ├── useRiskAnalytics.ts # 리스크 분석 훅 (New)
│   │   └── ...
│   ├── market-data.ts        # 시장 데이터 상수 (New)
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── context.tsx           # 전역 상태 관리
│   └── utils.ts              # 유틸리티 함수
└── styles/
    └── globals.css           # Global Styles
```

---

## 📞 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context + Hooks
- **Charts**: Chart.js, Recharts
- **Icons**: FontAwesome

---

## 📄 버전 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|----------|
| v1.4 | 2026-01-14 | 🔄 탭 구조 재편 (AssetTurnover 이동), ⚡ Analytics 리팩토링, 🐛 히트맵 버그 수정 |
| v1.3 | 2026-01-13 | 🔒 보안 강화, 🧩 컴포넌트 분리, ⚡ 성능 최적화 |
| v1.2 | 2026-01-13 | 🔧 컬럼 그룹핑 개선 |
| v1.1 | 2026-01-13 | 📊 Return 컬럼 개선, 🎨 UI 디테일 강화 |
| v1.0 | 2026-01-13 | 🚀 초기 릴리스 (탭 네비게이션 적용) |

---

## 📄 라이선스

Private Project - Personal Use Only