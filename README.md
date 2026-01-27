# NEXUS DASHBOARD v1.8.2

개인 투자 포트폴리오 관리 대시보드

## 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## v1.8.2 - Analytics 탭 리뉴얼

### 버블 차트 기반 새 레이아웃
- **BubbleChart**: X축(비중), Y축(수익률), 크기(투자금액)
  - 3가지 색상 모드: 섹터별 / 유형별 / 성과별
- **HealthScore**: 그라데이션 프로그레스 바 + 리스크 뱃지
- **RiskFactorsPanel**: 분산도, 집중위험, 변동성, 섹터집중 + 베타/샤프
- **InsightChips**: 포트폴리오 상태 기반 동적 알림
- **CorrelationHeatmap**: 접기/펼치기 기능 추가

---

## 주요 기능

### 탭 구성
| 탭 | 색상 | 기능 |
|----|------|------|
| Stellar Assets | Cyan | 자산 관리, 히트맵 |
| Income Stream | Gold | 배당 분석, 캘린더 |
| Analytics | Purple | 리스크 분석, 버블차트 |
| Performance | Green | 벤치마크, 월간 리포트 |
| Simulation | Orange | What-If, 스트레스 테스트 |

### AI 분석 (Freedom v31.0)
- Agent Mesh Architecture (Macro/Market/Sector)
- 분석 모드: Quick(15초) / Standard(45초) / Deep(90초)
- 지정학적 리스크 패널, VIX 연동

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Charts | Chart.js, Recharts |
| Testing | Vitest |

---

## Supabase 설정

Supabase SQL Editor에서 실행:

```sql
-- 테이블 생성
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

-- RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp ON portfolio_snapshots(user_id, timestamp DESC);
```

상세 가이드: `SUPABASE_OPTIMIZATION.md` 참조

---

## 버전 히스토리

| 버전 | 주요 변경 |
|------|----------|
| v1.8.2 | Analytics 탭 리뉴얼 (버블차트, 건강점수, 인사이트칩) |
| v1.8.1 | ETF 섹터 버그 수정, Price 애니메이션 개선 |
| v1.8.0 | Freedom v31.0 Agent Mesh, 지정학적 리스크 분석 |
| v1.7.2 | Supabase 최적화 (RLS, 인덱스) |
| v1.7.0 | Context 분리 리팩토링, Export 개선 |
| v1.6.0 | 매매 일지, FIFO 손익 계산 |
| v1.5.0 | 배당 캘린더, 성능 최적화 |

---

## 라이선스

Private Project - Personal Use Only
