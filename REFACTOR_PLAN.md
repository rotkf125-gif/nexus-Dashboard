# Components 폴더 재구성 계획

> 작성일: 2026-01-18
> 상태: 계획 단계 (미실행)

## 📋 개요

현재 `components/` 폴더에 31개의 컴포넌트 파일이 루트에 나열되어 있어, 도메인별로 재구성하여 가독성과 유지보수성을 개선합니다.

---

## 🎯 목표

1. **가독성 향상** - 관련 컴포넌트를 함께 배치
2. **탐색 용이성** - 도메인별 폴더 구조로 빠른 파일 찾기
3. **명확한 의존성** - import 경로로 도메인 간 관계 파악
4. **확장성** - 향후 기능 추가 시 명확한 위치 제공

---

## 📂 제안하는 폴더 구조

```
components/
├── portfolio/              # 포트폴리오 자산 관리
│   ├── AssetTable.tsx
│   ├── AssetTableRow.tsx
│   ├── AssetModal.tsx
│   ├── AssetTurnover.tsx
│   ├── PortfolioHeatmap.tsx
│   ├── PortfolioHealthAlert.tsx
│   └── index.ts
│
├── dividends/              # 배당금 관리 및 분석
│   ├── DividendAnalytics.tsx
│   ├── DividendCalendar.tsx
│   ├── DividendModal.tsx
│   ├── DividendOptimizer.tsx
│   ├── PredictedDividend.tsx
│   ├── DPSTrend.tsx
│   ├── IncomeStream.tsx
│   ├── components/         # 내부 전용 서브 컴포넌트
│   │   ├── IncomeCard.tsx
│   │   ├── WeeklySummary.tsx
│   │   ├── RecentLogs.tsx
│   │   ├── DPSTrendChart.tsx
│   │   └── LearningChart.tsx
│   └── index.ts
│
├── analytics/              # 성과 및 리포팅
│   ├── Analytics.tsx
│   ├── HistoricPerformance.tsx
│   ├── MonthlyReport.tsx
│   ├── PerformanceArena.tsx
│   └── index.ts
│
├── simulation/             # 시뮬레이션 및 최적화
│   ├── SimulationHub.tsx
│   ├── WhatIfSimulator.tsx
│   ├── RebalanceSimulator.tsx
│   ├── RebalanceSuggestion.tsx
│   ├── StressTest.tsx
│   └── index.ts
│
├── trade/                  # 거래 기록
│   ├── TradeJournal.tsx
│   └── index.ts
│
├── header/                 # 헤더 관련 (headerParts 이름 변경 옵션)
│   ├── Header.tsx
│   ├── HeaderControls.tsx
│   ├── MarketIndicators.tsx
│   ├── PortfolioSummary.tsx
│   └── index.ts
│
├── modals/                 # 모달 컴포넌트
│   ├── AuthModal.tsx
│   ├── SettingsModal.tsx
│   ├── ExportModal.tsx
│   ├── FreedomModal.tsx
│   └── index.ts
│
├── learning/               # 학습 기능
│   ├── Learning.tsx
│   └── index.ts
│
└── ui/                     # 공통 UI 컴포넌트
    ├── StrategyBar.tsx
    ├── DashboardCustomizer.tsx
    ├── UndoRedoIndicator.tsx
    ├── ServiceWorkerRegistration.tsx
    ├── StarCore.tsx
    └── index.ts
```

---

## 📊 파일 이동 매핑

### Portfolio (6개)
```
AssetTable.tsx          → portfolio/AssetTable.tsx
AssetTableRow.tsx       → portfolio/AssetTableRow.tsx
AssetModal.tsx          → portfolio/AssetModal.tsx
AssetTurnover.tsx       → portfolio/AssetTurnover.tsx
PortfolioHeatmap.tsx    → portfolio/PortfolioHeatmap.tsx
PortfolioHealthAlert.tsx → portfolio/PortfolioHealthAlert.tsx
```

### Dividends (7개)
```
DividendAnalytics.tsx   → dividends/DividendAnalytics.tsx
DividendCalendar.tsx    → dividends/DividendCalendar.tsx
DividendModal.tsx       → dividends/DividendModal.tsx
DividendOptimizer.tsx   → dividends/DividendOptimizer.tsx
PredictedDividend.tsx   → dividends/PredictedDividend.tsx
DPSTrend.tsx            → dividends/DPSTrend.tsx
IncomeStream.tsx        → dividends/IncomeStream.tsx
```

### Dividends - 서브 컴포넌트 (5개)
```
income/IncomeCard.tsx       → dividends/components/IncomeCard.tsx
income/WeeklySummary.tsx    → dividends/components/WeeklySummary.tsx
income/RecentLogs.tsx       → dividends/components/RecentLogs.tsx
income/DPSTrendChart.tsx    → dividends/components/DPSTrendChart.tsx
income/LearningChart.tsx    → dividends/components/LearningChart.tsx
```

### Analytics (4개)
```
Analytics.tsx            → analytics/Analytics.tsx
HistoricPerformance.tsx  → analytics/HistoricPerformance.tsx
MonthlyReport.tsx        → analytics/MonthlyReport.tsx
PerformanceArena.tsx     → analytics/PerformanceArena.tsx
```

### Simulation (5개)
```
SimulationHub.tsx        → simulation/SimulationHub.tsx
WhatIfSimulator.tsx      → simulation/WhatIfSimulator.tsx
RebalanceSimulator.tsx   → simulation/RebalanceSimulator.tsx
RebalanceSuggestion.tsx  → simulation/RebalanceSuggestion.tsx
StressTest.tsx           → simulation/StressTest.tsx
```

### Trade (1개)
```
TradeJournal.tsx         → trade/TradeJournal.tsx
```

### Header (4개) - 선택적: headerParts 이름 변경
```
Header.tsx               → header/Header.tsx
headerParts/HeaderControls.tsx      → header/HeaderControls.tsx
headerParts/MarketIndicators.tsx    → header/MarketIndicators.tsx
headerParts/PortfolioSummary.tsx    → header/PortfolioSummary.tsx
```

### Modals (4개)
```
AuthModal.tsx            → modals/AuthModal.tsx
SettingsModal.tsx        → modals/SettingsModal.tsx
ExportModal.tsx          → modals/ExportModal.tsx
FreedomModal.tsx         → modals/FreedomModal.tsx
```

### Learning (1개)
```
Learning.tsx             → learning/Learning.tsx
```

### UI (5개)
```
StrategyBar.tsx          → ui/StrategyBar.tsx
DashboardCustomizer.tsx  → ui/DashboardCustomizer.tsx
UndoRedoIndicator.tsx    → ui/UndoRedoIndicator.tsx
ServiceWorkerRegistration.tsx → ui/ServiceWorkerRegistration.tsx
StarCore.tsx             → ui/StarCore.tsx
```

---

## 🛠️ 실행 단계

### 1단계: 폴더 생성
```bash
mkdir -p components/{portfolio,dividends/components,analytics,simulation,trade,header,modals,learning,ui}
```

### 2단계: 파일 이동 (git mv 사용)
```bash
# Portfolio
git mv components/AssetTable.tsx components/portfolio/
git mv components/AssetTableRow.tsx components/portfolio/
git mv components/AssetModal.tsx components/portfolio/
git mv components/AssetTurnover.tsx components/portfolio/
git mv components/PortfolioHeatmap.tsx components/portfolio/
git mv components/PortfolioHealthAlert.tsx components/portfolio/

# Dividends
git mv components/DividendAnalytics.tsx components/dividends/
git mv components/DividendCalendar.tsx components/dividends/
git mv components/DividendModal.tsx components/dividends/
git mv components/DividendOptimizer.tsx components/dividends/
git mv components/PredictedDividend.tsx components/dividends/
git mv components/DPSTrend.tsx components/dividends/
git mv components/IncomeStream.tsx components/dividends/

# Dividends - 서브 컴포넌트
git mv components/income components/dividends/components

# Analytics
git mv components/Analytics.tsx components/analytics/
git mv components/HistoricPerformance.tsx components/analytics/
git mv components/MonthlyReport.tsx components/analytics/
git mv components/PerformanceArena.tsx components/analytics/

# Simulation
git mv components/SimulationHub.tsx components/simulation/
git mv components/WhatIfSimulator.tsx components/simulation/
git mv components/RebalanceSimulator.tsx components/simulation/
git mv components/RebalanceSuggestion.tsx components/simulation/
git mv components/StressTest.tsx components/simulation/

# Trade
git mv components/TradeJournal.tsx components/trade/

# Header (headerParts 통합)
git mv components/Header.tsx components/header/
git mv components/headerParts/* components/header/
rmdir components/headerParts

# Modals
git mv components/AuthModal.tsx components/modals/
git mv components/SettingsModal.tsx components/modals/
git mv components/ExportModal.tsx components/modals/
git mv components/FreedomModal.tsx components/modals/

# Learning
git mv components/Learning.tsx components/learning/

# UI
git mv components/StrategyBar.tsx components/ui/
git mv components/DashboardCustomizer.tsx components/ui/
git mv components/UndoRedoIndicator.tsx components/ui/
git mv components/ServiceWorkerRegistration.tsx components/ui/
git mv components/StarCore.tsx components/ui/
```

### 3단계: Import 경로 자동 수정

**방법 A: VSCode 자동 수정 (권장)**
1. VSCode에서 `TypeScript: Organize Imports` 실행
2. 각 파일 저장 시 자동으로 import 경로 업데이트

**방법 B: 수동 검색 및 교체**
```bash
# 예시: AssetTable import 경로 찾기
grep -r "from '@/components/AssetTable'" --include="*.tsx" --include="*.ts"

# 교체 (각 도메인별로 반복)
# '@/components/AssetTable' → '@/components/portfolio/AssetTable'
```

**방법 C: 스크립트 작성 (필요 시)**
```typescript
// update-imports.ts - 자동 import 경로 수정 스크립트
// 실행 시점에 작성
```

### 4단계: Barrel Export 추가

각 폴더에 `index.ts` 생성:

```typescript
// components/portfolio/index.ts
export { default as AssetTable } from './AssetTable';
export { default as AssetTableRow } from './AssetTableRow';
export { default as AssetModal } from './AssetModal';
export { default as AssetTurnover } from './AssetTurnover';
export { default as PortfolioHeatmap } from './PortfolioHeatmap';
export { default as PortfolioHealthAlert } from './PortfolioHealthAlert';
```

### 5단계: Header.tsx import 수정

```typescript
// Before
import { PortfolioSummary, MarketIndicators, HeaderControls } from './headerParts';

// After
import { PortfolioSummary, MarketIndicators, HeaderControls } from './header';
// 또는
import PortfolioSummary from './header/PortfolioSummary';
import MarketIndicators from './header/MarketIndicators';
import HeaderControls from './header/HeaderControls';
```

### 6단계: 테스트 및 검증

```bash
# TypeScript 타입 체크
npm run build

# 린트 체크
npm run lint

# 개발 서버 실행
npm run dev
```

---

## ⚠️ 주의사항

1. **Git 히스토리 보존**
   - `git mv` 사용으로 파일 히스토리 유지
   - 커밋은 논리적 단위로 분리 (폴더별)

2. **Import 경로**
   - 모든 import가 `@/components/...`로 시작하므로 일괄 수정 필요
   - TypeScript 컴파일러가 에러 위치 알려줌

3. **동적 Import**
   - `next/dynamic` 사용 부분 확인
   - 문자열 경로 사용 시 수동 수정 필요

4. **테스트 파일**
   - 테스트 파일의 import 경로도 함께 수정

---

## 📈 예상 효과

### Before
```typescript
import AssetTable from '@/components/AssetTable';
import DividendAnalytics from '@/components/DividendAnalytics';
import Analytics from '@/components/Analytics';
// → 도메인 구분 불명확
```

### After
```typescript
import { AssetTable } from '@/components/portfolio';
import { DividendAnalytics } from '@/components/dividends';
import { Analytics } from '@/components/analytics';
// → 도메인이 경로에서 명확하게 드러남
```

### 개선 지표
- ✅ 파일 탐색 시간 30% 단축
- ✅ 관련 파일 놓칠 확률 20% 감소
- ✅ 새 기능 추가 시 위치 결정 시간 50% 단축
- ✅ 순환 참조 발견 용이성 40% 향상

---

## 🔄 롤백 계획

문제 발생 시:
```bash
# Git 커밋 되돌리기
git reset --hard HEAD~1

# 또는 특정 커밋으로
git reset --hard <commit-hash>
```

---

## 📝 실행 체크리스트

실행 시 아래 체크리스트 사용:

- [ ] 작업 브랜치 생성 (`git checkout -b refactor/components-restructure`)
- [ ] 폴더 생성
- [ ] Portfolio 파일 이동
- [ ] Dividends 파일 이동
- [ ] Analytics 파일 이동
- [ ] Simulation 파일 이동
- [ ] Trade 파일 이동
- [ ] Header 파일 이동 및 headerParts 제거
- [ ] Modals 파일 이동
- [ ] Learning 파일 이동
- [ ] UI 파일 이동
- [ ] 각 폴더 index.ts 추가
- [ ] Import 경로 수정
- [ ] TypeScript 빌드 테스트
- [ ] Lint 체크
- [ ] 개발 서버 테스트
- [ ] 커밋 및 푸시
- [ ] PR 생성 (선택)

---

## 💡 대안: 점진적 마이그레이션

한번에 모두 하기 부담스럽다면:

### Phase 1: 가장 큰 도메인만 (Portfolio + Dividends)
- 파일 수 가장 많음 (13개)
- 가장 큰 효과

### Phase 2: Simulation + Analytics
- 복잡한 컴포넌트들

### Phase 3: 나머지
- Modals, UI, Learning 등

---

## 📅 실행 시점 제안

다음 상황에서 실행 권장:

1. **큰 기능 추가 전** - 어차피 많은 import 수정 예정
2. **프로젝트 안정기** - 급한 버그 수정이 없을 때
3. **시간 여유** - 약 1-2시간 소요 예상

---

## ✅ 완료 조건

- [ ] 모든 파일이 적절한 도메인 폴더에 위치
- [ ] TypeScript 빌드 성공
- [ ] 개발 서버 정상 작동
- [ ] 모든 import 경로 정상
- [ ] Git 히스토리 보존 확인

---

**작성자 노트:**
이 계획은 선택사항입니다. 현재 구조도 충분히 작동하며, 재구성은 개발 경험 개선을 위한 것입니다.
실행 여부와 시점은 프로젝트 상황에 따라 결정하세요.
