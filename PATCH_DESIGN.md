# NEXUS Dashboard - 패치 설계 문서

**작성일**: 2026-01-17  
**목적**: ARCHITECTURE_ANALYSIS.md 피드백 기반 개선 패치 설계

---

## 🎯 패치 목표

보고서에서 발견된 문제점을 해결하기 위한 **3단계 패치 계획**

---

## 📋 Phase 1: 긴급 패치 (즉시 적용 가능)

### 1.1 TradeModal 제거 ✅

**현재 상태:**
- `components/TradeModal.tsx` (289줄) 존재하지만 미사용
- `lib/context.tsx`에 관련 상태/함수 존재 (44-51줄, 97-99줄, 683-710줄)

**패치 내용:**
```bash
# 1. 파일 삭제
DELETE: components/TradeModal.tsx

# 2. Context에서 제거할 코드
lib/context.tsx:
  - Line 44-51: Trade Modal 인터페이스 정의
  - Line 97-99: Trade Modal 상태
  - Line 683-710: Trade Modal 함수들
  - Line 755-762: Provider value에서 제거
```

**예상 효과:**
- 코드 289줄 감소
- Context 약 40줄 감소
- 번들 크기 감소

---

### 1.2 상수 중앙화

**현재 상태:**
```typescript
// 여러 파일에 중복
const AFTER_TAX_RATE = 0.85;
```

**패치 내용:**
```typescript
// lib/config.ts에 추가
export const TAX_CONFIG = {
  AFTER_TAX_RATE: 0.85,
  DIVIDEND_TAX_RATE: 0.15,
} as const;
```

**영향 파일:**
- `components/MonthlyReport.tsx`
- `components/DividendAnalytics.tsx`
- `components/IncomeStream.tsx`

---

## 📋 Phase 2: 구조 개선 (1-2주)

### 2.1 Context 분리

**현재 상태:**
```
lib/context.tsx (786줄, 60+ 액션)
```

**패치 설계:**
```
lib/
├── contexts/
│   ├── index.tsx           # AppProviders (통합)
│   ├── PortfolioContext.tsx # 자산 관리 (~150줄)
│   ├── DividendContext.tsx  # 배당 관리 (~80줄)
│   ├── TradeContext.tsx     # 거래 관리 (~100줄)
│   ├── MarketContext.tsx    # 시장 데이터 (~100줄)
│   └── UIContext.tsx        # 모달, 테마, 토스트 (~150줄)
```

**분리 기준:**

#### PortfolioContext.tsx
```typescript
interface PortfolioContextType {
  assets: Asset[];
  updateAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (index: number) => void;
  updateAsset: (index: number, asset: Partial<Asset>) => void;
  refreshPrices: () => Promise<void>;
}
```

#### DividendContext.tsx
```typescript
interface DividendContextType {
  dividends: Dividend[];
  addDividend: (dividend: Dividend) => void;
  removeDividend: (index: number) => void;
  syncFromSheet: () => Promise<void>;
}
```

#### TradeContext.tsx
```typescript
interface TradeContextType {
  tradeLogs: TradeLog[];
  tradeSums: TradeSums;
  addTradeLog: (trade: TradeLog) => void;
  removeTradeLog: (id: string) => void;
  setTradeSums: (ticker: string, amount: number) => void;
  removeTradeSum: (ticker: string) => void;
}
```

#### MarketContext.tsx
```typescript
interface MarketContextType {
  market: MarketData;
  previousMarket: MarketData;
  exchangeRate: number;
  updateMarket: (market: Partial<MarketData>) => void;
  setExchangeRate: (rate: number) => void;
}
```

#### UIContext.tsx
```typescript
interface UIContextType {
  theme: ThemeType;
  compactMode: boolean;
  setTheme: (theme: ThemeType) => void;
  setCompactMode: (compact: boolean) => void;
  toast: (message: string, type?: ToastType) => void;
  // Modal states
  assetModalOpen: boolean;
  dividendModalOpen: boolean;
  // ... modal functions
}
```

**통합 Provider:**
```typescript
// lib/contexts/index.tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UIProvider>
      <MarketProvider>
        <PortfolioProvider>
          <DividendProvider>
            <TradeProvider>
              {children}
            </TradeProvider>
          </DividendProvider>
        </PortfolioProvider>
      </MarketProvider>
    </UIProvider>
  );
}

// 호환성을 위한 통합 훅
export function useNexus() {
  const portfolio = usePortfolio();
  const dividend = useDividend();
  const trade = useTrade();
  const market = useMarket();
  const ui = useUI();
  
  return {
    state: {
      assets: portfolio.assets,
      dividends: dividend.dividends,
      tradeLogs: trade.tradeLogs,
      tradeSums: trade.tradeSums,
      market: market.market,
      exchangeRate: market.exchangeRate,
      theme: ui.theme,
      // ...
    },
    ...portfolio,
    ...dividend,
    ...trade,
    ...market,
    ...ui,
  };
}
```

---

### 2.2 커스텀 훅 확장

**새로운 훅 추가:**

#### usePortfolioStats.ts
```typescript
// lib/hooks/usePortfolioStats.ts
export function usePortfolioStats() {
  const { assets, exchangeRate } = useNexus();
  
  return useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + a.qty * a.price, 0);
    const totalCost = assets.reduce((sum, a) => sum + a.qty * a.avg, 0);
    const profit = totalValue - totalCost;
    const returnPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const totalValueKRW = totalValue * exchangeRate;
    
    return {
      totalValue,
      totalCost,
      profit,
      returnPct,
      totalValueKRW,
      assetCount: assets.length,
    };
  }, [assets, exchangeRate]);
}
```

#### useDividendStats.ts
```typescript
// lib/hooks/useDividendStats.ts
import { TAX_CONFIG } from '../config';

export function useDividendStats() {
  const { dividends, exchangeRate } = useNexus();
  
  return useMemo(() => {
    const totalDividends = dividends.reduce(
      (sum, d) => sum + d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE, 
      0
    );
    
    const monthlyDividends = dividends.reduce((acc, d) => {
      const month = d.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + d.qty * d.dps * TAX_CONFIG.AFTER_TAX_RATE;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalDividends,
      totalDividendsKRW: totalDividends * exchangeRate,
      monthlyDividends,
      dividendCount: dividends.length,
    };
  }, [dividends, exchangeRate]);
}
```

#### useTradeStats.ts
```typescript
// lib/hooks/useTradeStats.ts
export function useTradeStats() {
  const { tradeSums } = useNexus();
  
  return useMemo(() => {
    const entries = Object.entries(tradeSums);
    const totalRealized = entries.reduce((sum, [, val]) => sum + (val || 0), 0);
    
    const topGainers = entries
      .filter(([, pnl]) => pnl > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const topLosers = entries
      .filter(([, pnl]) => pnl < 0)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
    
    return {
      totalRealized,
      tickerCount: entries.length,
      topGainers,
      topLosers,
    };
  }, [tradeSums]);
}
```

---

### 2.3 에러 처리 표준화

**새로운 에러 유틸리티:**

```typescript
// lib/errors.ts
export class NexusError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'NexusError';
  }
}

export class APIError extends NexusError {
  constructor(
    public status: number,
    message: string
  ) {
    super(message, `API_${status}`, status < 500);
  }
}

export class ValidationError extends NexusError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION', true);
  }
}
```

**API 호출 래퍼:**
```typescript
// lib/api.ts
export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(endpoint, options);
    
    if (!res.ok) {
      throw new APIError(res.status, `HTTP ${res.status}`);
    }
    
    return await res.json() as T;
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new NexusError('Network error', 'NETWORK', true);
  }
}
```

---

## 📋 Phase 3: 품질 개선 (2-4주)

### 3.1 컴포넌트 분해

**IncomeStream.tsx (462줄) 분해:**
```
components/income/
├── IncomeStream.tsx      # 메인 컨테이너 (~100줄)
├── IncomeCard.tsx        # 개별 카드 (기존)
├── IncomeStats.tsx       # 통계 섹션 (~80줄)
├── IncomeChart.tsx       # 차트 섹션 (~100줄)
├── IncomeDividendList.tsx # 배당 목록 (~80줄)
└── index.ts              # 배럴 export
```

**Header.tsx (482줄) 분해:**
```
components/header/
├── Header.tsx            # 메인 컨테이너 (~100줄)
├── PortfolioSummary.tsx  # 포트폴리오 요약 (~100줄)
├── MarketIndicators.tsx  # 시장 지표 (~80줄)
├── ActionButtons.tsx     # 액션 버튼들 (~80줄)
├── SyncStatus.tsx        # 동기화 상태 (~50줄)
└── index.ts              # 배럴 export
```

---

### 3.2 테스트 추가

**테스트 구조:**
```
components/__tests__/
├── TradeJournal.test.tsx
├── IncomeStream.test.tsx
├── MonthlyReport.test.tsx
└── Header.test.tsx

lib/__tests__/
├── utils.test.ts (기존)
├── contexts/
│   ├── PortfolioContext.test.tsx
│   ├── TradeContext.test.tsx
│   └── DividendContext.test.tsx
└── hooks/
    ├── usePortfolioStats.test.ts
    └── useTradeStats.test.ts
```

**예시 테스트:**
```typescript
// lib/__tests__/hooks/usePortfolioStats.test.ts
import { renderHook } from '@testing-library/react';
import { usePortfolioStats } from '../../hooks/usePortfolioStats';
import { NexusProvider } from '../../context';

describe('usePortfolioStats', () => {
  it('should calculate total value correctly', () => {
    const wrapper = ({ children }) => (
      <NexusProvider initialAssets={[
        { ticker: 'AAPL', qty: 10, price: 150, avg: 100 }
      ]}>
        {children}
      </NexusProvider>
    );
    
    const { result } = renderHook(() => usePortfolioStats(), { wrapper });
    
    expect(result.current.totalValue).toBe(1500);
    expect(result.current.totalCost).toBe(1000);
    expect(result.current.profit).toBe(500);
    expect(result.current.returnPct).toBe(50);
  });
});
```

---

## 📊 패치 우선순위 매트릭스

| 패치 | 난이도 | 영향도 | 위험도 | 우선순위 |
|-----|-------|-------|-------|---------|
| TradeModal 제거 | 낮음 | 낮음 | 낮음 | **1** |
| 상수 중앙화 | 낮음 | 낮음 | 낮음 | **2** |
| 커스텀 훅 추가 | 중간 | 중간 | 낮음 | **3** |
| Context 분리 | 높음 | 높음 | 중간 | **4** |
| 컴포넌트 분해 | 중간 | 중간 | 낮음 | **5** |
| 에러 처리 표준화 | 중간 | 중간 | 낮음 | **6** |
| 테스트 추가 | 높음 | 높음 | 낮음 | **7** |

---

## 🚀 즉시 적용 가능한 패치

### Patch 1: TradeModal 제거

```bash
# 실행 순서
1. components/TradeModal.tsx 삭제
2. lib/context.tsx 수정 (관련 코드 제거)
3. 빌드 테스트
4. 커밋
```

### Patch 2: 상수 중앙화

```typescript
// lib/config.ts에 추가
export const TAX_CONFIG = {
  AFTER_TAX_RATE: 0.85,
  DIVIDEND_TAX_RATE: 0.15,
} as const;

export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 1000,
  MAX_HISTORY: 10,
} as const;
```

### Patch 3: 커스텀 훅 추가

```typescript
// lib/hooks/index.ts 업데이트
export * from './useAssetTable';
export * from './useModal';
export * from './usePortfolio';
export * from './usePriceRefresh';
export * from './useRiskAnalytics';
export * from './useToast';
// 새로 추가
export * from './usePortfolioStats';
export * from './useDividendStats';
export * from './useTradeStats';
```

---

## ⚠️ 주의사항

### 호환성 유지
- `useNexus()` 훅의 기존 인터페이스 유지
- 점진적 마이그레이션 (한 번에 모든 컴포넌트 변경 X)
- 각 패치 후 전체 빌드 테스트

### 롤백 계획
- 각 패치는 독립적으로 롤백 가능하도록 설계
- Git 브랜치 전략: `feature/patch-{number}`
- 문제 발생 시 이전 커밋으로 복구

### 테스트 체크리스트
- [ ] 빌드 성공
- [ ] 개발 서버 정상 실행
- [ ] 자산 추가/수정/삭제
- [ ] 배당 기록 추가
- [ ] 거래 기록 추가
- [ ] 가격 새로고침
- [ ] Undo/Redo 동작
- [ ] 테마 변경
- [ ] 모달 열기/닫기

---

## 📅 예상 일정

| Phase | 기간 | 패치 내용 |
|-------|------|----------|
| Phase 1 | 1-2일 | TradeModal 제거, 상수 중앙화 |
| Phase 2 | 1-2주 | Context 분리, 커스텀 훅 |
| Phase 3 | 2-4주 | 컴포넌트 분해, 테스트 |

---

**다음 단계**: Phase 1 패치 즉시 적용 여부 확인
