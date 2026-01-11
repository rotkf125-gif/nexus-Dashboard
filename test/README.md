# Nexus Dashboard - 테스트 서버 가이드

이 문서는 Nexus Dashboard 프로젝트의 테스트 환경과 테스트 서버 사용 방법을 설명합니다.

## 📋 목차

- [개요](#개요)
- [설치된 테스트 도구](#설치된-테스트-도구)
- [테스트 실행 방법](#테스트-실행-방법)
- [프로젝트 구조](#프로젝트-구조)
- [테스트 서버 사용법](#테스트-서버-사용법)
- [예제 테스트](#예제-테스트)
- [모킹 가이드](#모킹-가이드)
- [테스트 작성 가이드라인](#테스트-작성-가이드라인)

## 개요

Nexus Dashboard는 **Vitest**와 **React Testing Library**를 사용하여 다음과 같은 테스트를 지원합니다:

- ✅ **Unit Tests**: 유틸리티 함수, 훅, 타입 검증
- ✅ **API Route Tests**: Next.js API 엔드포인트 테스트
- ✅ **Component Tests**: React 컴포넌트 렌더링 및 상호작용 테스트
- ✅ **Integration Tests**: API와 데이터베이스 통합 테스트

## 설치된 테스트 도구

```json
{
  "vitest": "^4.0.16",                      // 테스트 러너
  "@vitest/ui": "^4.0.16",                  // UI 인터페이스
  "@testing-library/react": "^16.3.1",      // React 컴포넌트 테스트
  "@testing-library/jest-dom": "^6.9.1",    // DOM 매처
  "@testing-library/user-event": "^14.6.1", // 사용자 이벤트 시뮬레이션
  "jsdom": "^27.4.0",                       // DOM 환경
  "happy-dom": "^20.1.0"                    // 경량 DOM 환경
}
```

## 테스트 실행 방법

### 기본 테스트 실행

```bash
# 모든 테스트 실행 (watch 모드)
npm test

# 한 번만 실행
npm run test:run

# Watch 모드로 실행
npm run test:watch
```

### UI 모드로 테스트 실행

```bash
npm run test:ui
```

브라우저에서 `http://localhost:51204` 열기 → 테스트를 시각적으로 확인 및 디버깅 가능

### 커버리지 확인

```bash
npm run test:coverage
```

커버리지 리포트는 `coverage/` 디렉토리에 생성됩니다.

## 프로젝트 구조

```
nexus-Dashboard/
├── test/
│   ├── setup.ts                    # 테스트 환경 설정
│   ├── mocks/
│   │   ├── supabase.ts            # Supabase 모킹
│   │   └── yahoo-finance.ts       # Yahoo Finance API 모킹
│   ├── utils/
│   │   ├── test-utils.tsx         # React 테스트 유틸리티
│   │   └── api-test-helpers.ts    # API 테스트 헬퍼
│   ├── server/
│   │   └── test-server.ts         # 테스트 서버 클래스
│   └── README.md                   # 이 문서
├── app/api/
│   ├── price/__tests__/
│   │   └── route.test.ts          # Price API 테스트
│   └── market/__tests__/
│       └── route.test.ts          # Market API 테스트
├── lib/__tests__/
│   └── utils.test.ts              # 유틸리티 함수 테스트
└── vitest.config.ts               # Vitest 설정
```

## 테스트 서버 사용법

### TestServer 클래스

`TestServer` 클래스는 통합 테스트를 위한 모킹 환경을 제공합니다.

```typescript
import { createTestServer } from '@/test/server/test-server'

describe('My API Test', () => {
  let testServer: ReturnType<typeof createTestServer>

  beforeEach(() => {
    testServer = createTestServer()
  })

  afterEach(() => {
    testServer.teardown()
  })

  it('should fetch data', async () => {
    // Yahoo Finance API 응답 모킹
    testServer.mockYahooFinance({
      chart: {
        result: [
          {
            meta: {
              regularMarketPrice: 150.25,
              marketState: 'REGULAR',
            },
          },
        ],
      },
    })

    // 테스트 실행
    // ...
  })
})
```

### TestServer 주요 메서드

| 메서드 | 설명 |
|--------|------|
| `mockYahooFinance(data)` | Yahoo Finance API 응답 모킹 |
| `mockSupabaseQuery(table, response)` | Supabase 쿼리 결과 모킹 |
| `mockNetworkError()` | 네트워크 오류 시뮬레이션 |
| `mockTimeout(delay)` | 타임아웃 시뮬레이션 |
| `reset()` | 모든 모킹 초기화 |
| `teardown()` | 테스트 서버 종료 |

## 예제 테스트

### API Route 테스트

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'
import { createMockNextRequest } from '@/test/utils/api-test-helpers'
import { createTestServer } from '@/test/server/test-server'

describe('/api/price/[ticker]', () => {
  let testServer: ReturnType<typeof createTestServer>

  beforeEach(() => {
    testServer = createTestServer()
  })

  it('should return stock price', async () => {
    testServer.mockYahooFinance({
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 150.25,
            previousClose: 149.50,
            marketState: 'REGULAR',
          },
        }],
      },
    })

    const request = createMockNextRequest({
      url: 'http://localhost:3000/api/price/AAPL',
    })

    const response = await GET(request, { params: { ticker: 'AAPL' } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.price).toBe(150.25)
  })
})
```

### 유틸리티 함수 테스트

```typescript
import { describe, it, expect } from 'vitest'
import { utcToKST, formatKST } from '../utils'

describe('utcToKST', () => {
  it('should convert UTC to KST', () => {
    const utcDate = new Date('2024-01-15T12:00:00Z')
    const kstDate = utcToKST(utcDate)

    expect(kstDate.getUTCHours()).toBe(21)
  })
})
```

### React 컴포넌트 테스트

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />)

    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

## 모킹 가이드

### Yahoo Finance API 모킹

```typescript
import { setupFetchMock, mockYahooFinanceResponse } from '@/test/mocks/yahoo-finance'

// 기본 응답 사용
setupFetchMock()

// 커스텀 응답 사용
setupFetchMock({
  chart: {
    result: [{
      meta: {
        regularMarketPrice: 200.00,
        marketState: 'PRE',
        preMarketPrice: 201.50,
      },
    }],
  },
})
```

### Supabase 모킹

```typescript
import { mockSupabaseClient } from '@/test/mocks/supabase'

// 특정 테이블 응답 모킹
mockSupabaseClient.from.mockImplementation((table) => {
  if (table === 'assets') {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [{ id: '1', ticker: 'AAPL' }],
          error: null,
        })),
      })),
    }
  }
})
```

### 환경 변수 모킹

환경 변수는 `test/setup.ts`에서 자동으로 모킹됩니다:

```typescript
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.GEMINI_API_KEY = 'test-gemini-key'
```

## 테스트 작성 가이드라인

### 1. 테스트 파일 위치

- API Routes: `app/api/[route]/__tests__/route.test.ts`
- 컴포넌트: `components/__tests__/ComponentName.test.tsx`
- 유틸리티: `lib/__tests__/utils.test.ts`
- 훅: `lib/hooks/__tests__/useHook.test.ts`

### 2. 테스트 작성 패턴

**AAA 패턴 (Arrange-Act-Assert) 사용:**

```typescript
it('should do something', () => {
  // Arrange: 테스트 환경 설정
  const testData = { foo: 'bar' }

  // Act: 테스트 실행
  const result = myFunction(testData)

  // Assert: 결과 검증
  expect(result).toBe(expected)
})
```

### 3. 테스트 명명 규칙

- **긍정 케이스**: `should return X when Y`
- **부정 케이스**: `should throw error when X is invalid`
- **엣지 케이스**: `should handle edge case Z`

### 4. 테스트 커버리지 목표

- 유틸리티 함수: **100%**
- API Routes: **90%+**
- 컴포넌트: **80%+**
- 통합 테스트: 주요 사용자 플로우

### 5. 모킹 원칙

- **외부 API는 항상 모킹**: Yahoo Finance, Supabase, etc.
- **시간 관련 테스트는 `vi.setSystemTime()` 사용**
- **랜덤 값은 고정**: `vi.spyOn(Math, 'random').mockReturnValue(0.5)`

## 자주 사용하는 명령어

```bash
# 특정 파일만 테스트
npm test -- path/to/test.test.ts

# 특정 패턴 테스트
npm test -- --grep "API"

# 변경된 파일만 테스트
npm test -- --changed

# 디버그 모드
npm test -- --inspect-brk

# 병렬 실행 비활성화
npm test -- --no-threads
```

## 트러블슈팅

### 테스트가 느릴 때

```bash
# 병렬 실행 비활성화
npm test -- --no-threads

# 특정 파일만 실행
npm test -- specific.test.ts
```

### 모킹이 작동하지 않을 때

```typescript
// beforeEach에서 모킹 초기화 확인
beforeEach(() => {
  vi.clearAllMocks()
  testServer.reset()
})
```

### Next.js 캐싱 문제

```typescript
// API Route에서 캐싱 비활성화
const response = await fetch(url, {
  cache: 'no-store',
  next: { revalidate: 0 },
})
```

## 추가 리소스

- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library 가이드](https://testing-library.com/react)
- [Next.js 테스트 가이드](https://nextjs.org/docs/testing/vitest)

---

**마지막 업데이트**: 2026-01-11
**버전**: 1.0.0
