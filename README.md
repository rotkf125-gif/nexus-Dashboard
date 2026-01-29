# NEXUS DASHBOARD v1.8.6

개인 투자 포트폴리오 관리 대시보드

## 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## v1.8.6 - DashboardHeader 통합 & 레이아웃 개선

### DashboardHeader 통합 컴포넌트
- **새 컴포넌트**: `components/DashboardHeader.tsx`
- **7:3 레이아웃**: 좌측 70% (Header + StrategyBar) / 우측 30% (PortfolioHealthAlert)
- **알림 없을 때**: "포트폴리오 상태 양호" 표시
- **컴팩트 알림**: 아이콘, 텍스트 크기 최적화

### Trade Journal 개선
- **접기 기능 제거**: 항상 표시되는 스크롤 형식
- **ADD TRADE 버튼**: 상단 헤더 옆 고정 배치
- **버튼 클릭 오류 수정**: 이벤트 전파 방지 추가

### 탭 헤더 버튼 배치 개선
- **Stellar Assets**: 컬럼/뷰모드/새로고침/IGNITE STAR 버튼 제목 옆 배치
- **Income Stream**: SYNC/RECORD 버튼 제목 옆 배치

### Analytics 탭 개선
- **상관관계 히트맵 제거**
- **9:1 레이아웃**: 자산 분포(BubbleChart) 90% / 인사이트 알람 10%

### Asset Table 개선
- **동일 티커 동일 색상**: 티커별 색상 매핑으로 같은 종목 동일 색상 표시

### Header Controls 정렬
- **SyncTime 위치 변경**: Connect 버튼 왼쪽으로 이동
- **2행 정렬**: justify-end로 우측 정렬 통일

---

## v1.8.5 - Header 2-Row & Asset Table 개선

### Header 2-Row 레이아웃 리뉴얼
- **2행 구조**:
  - Row1: 로고 | 마켓 데이터 | Connect/Login/설정
  - Row2: 시간 | 포트폴리오 | 경과시간/Export/AI
- **마켓 데이터**: 시장 상태 색상 테두리 박스, 상태 텍스트 표시
- **포트폴리오**: 평가/원금/수익 라벨 추가, 테두리 제거
- **텍스트 색상**: 흰색 계열 투명도 제거 (완전한 흰색)

### Trade Journal 개선
- **열기/닫기 토글**: InsightsPanel 내 collapsible 기능
- **스크롤 지원**: 최대 높이 300px, 초과 시 스크롤

### Asset Table 개선
- **정렬 통일**: 모든 컬럼 가운데 정렬
- **텍스트 색상**: 흰색 계열 투명도 제거 (완전한 흰색)
- **가격 인디케이터**: 셀 내 오른쪽 끝 배치 (현재가 고정)
- **모바일 뷰**: 라벨 및 숫자 색상 통일

---

## v1.8.4 - Stellar Assets 탭 & Header 리뉴얼

### Header 1-Row Horizontal Full Width 레이아웃
- **단일 라인 구성**: 로고 | 포트폴리오(가로) | 시장지표(가로) | 컨트롤 버튼
- **포트폴리오 섹션**: 평가$/₩, 원금, 손익 가로 인라인 형식
- **시장 지표 섹션**: 마켓상태, NDX, SPX, VIX, 환율, 10Y, 동기화 상태, 시계
- **컨트롤 버튼**: 아이콘+텍스트 조합 (Login, Connect, Export, AI, 설정)
- `flex-1` 활용 여백 없이 전체 너비 활용

### Stellar Assets Command Center 레이아웃
- **Quick Stats**: 총 평가, 수익률, 종목수, 평균 매수환율 상단 표시
- **2분할 레이아웃**: Assets (65%) + Insights (35%)
- **Insights Panel**: Type Distribution, Top Performers, Trade Journal 통합

### 새 컴포넌트
- `components/stellar/QuickStats.tsx`: 상단 요약 통계
- `components/stellar/InsightsPanel.tsx`: 우측 인사이트 패널

### 기능 개선
- **평균 매수환율**: 원금 가중평균 환율 계산 (usePortfolioStats)
- **Top Performers**: 수익률 상위 3종목 표시
- **Trade Journal Compact**: InsightsPanel 내 컴팩트 모드 추가

### 정리
- Dividend Countdown 섹션 삭제 (Stellar 탭)
- 하단 Trade Journal 섹션 삭제 (InsightsPanel로 이동)
- Header 하위 컴포넌트 통합 (단일 파일로 리팩토링)

---

## v1.8.3 - Simulation 탭 리뉴얼 & 접근성 개선

### Simulation Lab - Mission Control 레이아웃
- **Scenario Control**: 5개 지정학적 프리셋 + 4개 슬라이더 (금리/NASDAQ/환율/VIX)
- **Impact Visualization**: 실시간 포트폴리오 영향도 차트, 섹터별 영향 시각화
- **Rebalance Optimizer**: 컴팩트 리밸런싱 (목표 비중 설정, 거래 제안)
- **Stress Test Compact**: 6개 역사적 시나리오 빠른 테스트, 방어력 점수

### 티커 병합 처리 개선
- 분석/퍼포먼스 탭에서 동일 티커 통합 표시
- BubbleChart, usePortfolioStats, useRiskAnalytics 병합 로직 적용
- Asset 탭은 개별 표시 유지 (계좌별 관리)

### 네비게이션 탭 제목 추가
- Analytics → **RISK ANALYTICS**
- Performance → **PERFORMANCE ARENA**
- Simulation → **SIMULATION LAB**

### 접근성(A11y) 대비율 개선
- `text-white/40` → `text-white/60` (4.0:1 → 7.2:1)
- `text-white/50` → `text-white/70` (5.5:1 → 9.5:1)
- 모든 텍스트 WCAG AAA 기준(7:1) 충족

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
| v1.8.6 | DashboardHeader 통합 컴포넌트, 7:3 레이아웃, Analytics 9:1, 동일 티커 동일 색상 |
| v1.8.5 | Header 2-Row 리뉴얼, Asset Table 정렬/색상 개선, Trade Journal 토글 |
| v1.8.4 | Header 1-Row Horizontal 리뉴얼, Stellar Assets Command Center |
| v1.8.3 | Simulation 탭 Mission Control 리뉴얼, 티커 병합 처리, WCAG AAA 접근성 |
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
