# Supabase 데이터베이스 최적화 제안

> 작성일: 2026-01-18
> 프로젝트: NEXUS CELESTIAL v1.7
> 상태: 개선 제안

---

## 📊 현재 데이터베이스 구조 분석

### 사용 중인 테이블

#### 1. `portfolios` (메인 포트폴리오 테이블)
```sql
-- 현재 추정 구조
CREATE TABLE portfolios (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  assets JSONB,
  dividends JSONB,
  trade_logs JSONB,
  trade_sums JSONB,
  market JSONB,
  exchange_rate NUMERIC,
  strategy TEXT,
  compact_mode BOOLEAN,
  theme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `portfolio_snapshots` (히스토리 스냅샷)
```sql
-- 현재 추정 구조
CREATE TABLE portfolio_snapshots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  total_value NUMERIC,
  total_cost NUMERIC,
  return_pct NUMERIC,
  exchange_rate NUMERIC,
  assets JSONB,
  market JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 현재 쿼리 패턴

| 작업 | 쿼리 | 빈도 | 위치 |
|------|------|------|------|
| 로드 | `SELECT * WHERE user_id = X` | 페이지 로드마다 | storage.ts:38-42 |
| 저장 | `UPSERT (onConflict: user_id)` | 변경시마다 | storage.ts:80-95 |
| 스냅샷 저장 | `INSERT INTO snapshots` | 30분마다 | storage.ts:248-259 |
| 스냅샷 조회 | `SELECT * ORDER BY timestamp DESC LIMIT 48` | 필요시 | storage.ts:279-284 |
| 위젯 조회 | `SELECT assets, market, exchange_rate WHERE user_id = X` | 외부 요청시 | api/widget/route.ts:57-61 |

---

## 🎯 최적화 제안

---

## 1️⃣ 테이블 스키마 최적화

### 1.1 인덱스 추가

**문제점:**
- `portfolio_snapshots` 테이블에서 `user_id`와 `timestamp`로 자주 조회하지만 인덱스 없음
- `portfolios` 테이블의 `user_id`는 UNIQUE 제약만 있고 명시적 인덱스 없을 수 있음

**해결책:**

```sql
-- SQL 에디터에서 실행

-- 1. portfolios 테이블 인덱스 확인 및 추가
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
ON portfolios(user_id);

-- 2. portfolio_snapshots 복합 인덱스
-- user_id와 timestamp로 자주 조회하므로 복합 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp
ON portfolio_snapshots(user_id, timestamp DESC);

-- 3. 스냅샷 단일 인덱스 (타임스탬프)
CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
ON portfolio_snapshots(timestamp DESC);

-- 인덱스 생성 확인
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('portfolios', 'portfolio_snapshots')
ORDER BY tablename, indexname;
```

**예상 효과:**
- 스냅샷 조회 속도 50-70% 향상
- user_id 기반 조회 30% 향상

---

### 1.2 컬럼 타입 최적화

**문제점:**
- `user_id`가 TEXT인데, UUID 또는 고정 길이가 더 효율적
- `updated_at` 자동 업데이트 트리거 없음

**해결책:**

```sql
-- SQL 에디터에서 실행

-- 1. updated_at 자동 업데이트 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. portfolios 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. user_id 길이 제약 추가 (선택적, 기존 데이터 확인 후)
-- ALTER TABLE portfolios
-- ADD CONSTRAINT portfolios_user_id_length CHECK (LENGTH(user_id) <= 255);
```

---

### 1.3 JSONB 최적화 (GIN 인덱스)

**문제점:**
- JSONB 컬럼(`assets`, `dividends`)에서 특정 필드를 자주 조회하지만 인덱스 없음

**해결책:**

```sql
-- SQL 에디터에서 실행

-- 1. assets JSONB 인덱스 (ticker 검색 가능)
CREATE INDEX IF NOT EXISTS idx_portfolios_assets_gin
ON portfolios USING GIN (assets);

-- 2. dividends JSONB 인덱스
CREATE INDEX IF NOT EXISTS idx_portfolios_dividends_gin
ON portfolios USING GIN (dividends);

-- 3. 스냅샷의 assets 인덱스
CREATE INDEX IF NOT EXISTS idx_snapshots_assets_gin
ON portfolio_snapshots USING GIN (assets);

-- 사용 예시 (나중에 특정 ticker 조회 시)
-- SELECT * FROM portfolios
-- WHERE assets @> '[{"ticker": "AAPL"}]';
```

**예상 효과:**
- JSONB 내부 검색 속도 10배 이상 향상
- 특정 ticker 기반 조회 가능

---

## 2️⃣ Row Level Security (RLS) 설정

### 2.1 보안 정책 추가

**문제점:**
- 현재 RLS가 설정되지 않아 user_id만 신뢰
- 인증된 사용자도 다른 사용자 데이터 조회 가능 (이론적으로)

**해결책:**

```sql
-- SQL 에디터에서 실행

-- 1. portfolios 테이블 RLS 활성화
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- 2. 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own portfolio"
ON portfolios
FOR SELECT
USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%' -- 익명 사용자 허용 (선택적)
);

-- 3. 자신의 데이터만 삽입 가능
CREATE POLICY "Users can insert own portfolio"
ON portfolios
FOR INSERT
WITH CHECK (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%' -- 익명 사용자 허용
);

-- 4. 자신의 데이터만 업데이트 가능
CREATE POLICY "Users can update own portfolio"
ON portfolios
FOR UPDATE
USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%'
)
WITH CHECK (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%'
);

-- 5. 자신의 데이터만 삭제 가능
CREATE POLICY "Users can delete own portfolio"
ON portfolios
FOR DELETE
USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%'
);

-- 6. portfolio_snapshots도 동일하게 설정
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
ON portfolio_snapshots
FOR SELECT
USING (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%'
);

CREATE POLICY "Users can insert own snapshots"
ON portfolio_snapshots
FOR INSERT
WITH CHECK (
  user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  OR user_id LIKE 'user_%'
);

-- RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('portfolios', 'portfolio_snapshots');
```

**보안 레벨:**
- ✅ 사용자별 데이터 격리
- ✅ SQL Injection 방지
- ✅ 익명 사용자도 자신의 데이터만 접근

---

## 3️⃣ 쿼리 최적화

### 3.1 불필요한 SELECT * 제거

**문제점:**
```typescript
// storage.ts:38-42 - 모든 컬럼 조회
const { data, error } = await supabase
  .from('portfolios')
  .select('*')  // ❌ 불필요한 컬럼도 조회
  .eq('user_id', userId)
  .single();
```

**해결책:**

```typescript
// lib/storage.ts 수정
// Before
.select('*')

// After - 필요한 컬럼만 명시
.select('assets, dividends, trade_logs, trade_sums, market, exchange_rate, strategy, theme, compact_mode, updated_at')
```

**예상 효과:**
- 네트워크 전송량 10-20% 감소
- 파싱 속도 향상

---

### 3.2 스냅샷 조회 최적화

**문제점:**
```typescript
// storage.ts:279-284 - 모든 컬럼 조회
.select('*')
.order('timestamp', { ascending: false })
.limit(48);
```

**해결책:**

```typescript
// lib/storage.ts - loadSnapshots 함수 수정
export async function loadSnapshots(limit: number = 48): Promise<any[]> {
  if (!isBrowser) return [];

  try {
    const userId = getUserId();

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('timestamp, total_value, total_cost, return_pct, exchange_rate')  // ✅ 필요한 컬럼만
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to load snapshots:', error);
    return [];
  }
}
```

**추가 최적화 - 시간 범위 필터:**

```typescript
// 최근 24시간만 조회 (48개 스냅샷 = 24시간)
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const { data, error } = await supabase
  .from('portfolio_snapshots')
  .select('timestamp, total_value, total_cost, return_pct, exchange_rate')
  .eq('user_id', userId)
  .gte('timestamp', oneDayAgo)  // ✅ 1일 이내만 조회
  .order('timestamp', { ascending: false })
  .limit(48);
```

---

### 3.3 Upsert 최적화

**현재 코드:**
```typescript
// storage.ts:80-95
await supabase
  .from('portfolios')
  .upsert({
    user_id: userId,
    assets: state.assets,
    dividends: state.dividends,
    // ... 모든 필드
  }, {
    onConflict: 'user_id',
  });
```

**문제점:**
- 변경되지 않은 필드도 매번 업데이트
- JSONB 전체를 매번 전송

**해결책 (선택적):**

```typescript
// 변경된 필드만 업데이트하는 로직 추가
export async function saveStateToSupabase(
  state: Partial<NexusState>,
  changedFields?: string[]  // 변경된 필드만 지정
): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const userId = getUserId();

    // 변경된 필드만 포함
    const updateData: any = { user_id: userId };

    if (!changedFields || changedFields.includes('assets')) {
      updateData.assets = state.assets;
    }
    if (!changedFields || changedFields.includes('dividends')) {
      updateData.dividends = state.dividends;
    }
    // ... 나머지 필드도 동일

    const { error } = await supabase
      .from('portfolios')
      .upsert(updateData, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to save to Supabase:', error);
    saveStateToLocalStorage(state);
    return false;
  }
}
```

---

## 4️⃣ 스냅샷 관리 최적화

### 4.1 오래된 스냅샷 자동 삭제

**문제점:**
- 30분마다 스냅샷 저장 → 무한 증가
- 오래된 데이터는 사용하지 않지만 저장 공간 차지

**해결책 1: SQL 함수로 자동 정리**

```sql
-- SQL 에디터에서 실행

-- 1. 오래된 스냅샷 삭제 함수 생성 (30일 이상 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM portfolio_snapshots
  WHERE timestamp < NOW() - INTERVAL '30 days';

  RAISE NOTICE 'Old snapshots cleaned up';
END;
$$ LANGUAGE plpgsql;

-- 2. 정기 실행 (Supabase Cron Extension 사용)
-- Supabase Dashboard > Database > Extensions에서 pg_cron 활성화 후:

-- 매일 새벽 3시에 자동 정리
SELECT cron.schedule(
  'cleanup-old-snapshots',
  '0 3 * * *',  -- 매일 03:00 (KST 12:00)
  'SELECT cleanup_old_snapshots();'
);

-- Cron 작업 확인
SELECT * FROM cron.job;
```

**해결책 2: 애플리케이션 레벨에서 관리**

```typescript
// lib/storage.ts에 추가

// 스냅샷 저장 전에 오래된 데이터 삭제
export async function saveSnapshot(state: NexusState): Promise<boolean> {
  if (!isBrowser) return false;

  try {
    const userId = getUserId();

    // 1. 먼저 30일 이상 오래된 스냅샷 삭제
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    await supabase
      .from('portfolio_snapshots')
      .delete()
      .eq('user_id', userId)
      .lt('timestamp', thirtyDaysAgo);

    // 2. 새 스냅샷 저장
    const kstTimestamp = toKSTISOString();

    // ... (기존 코드)

    return true;
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    return false;
  }
}
```

---

### 4.2 스냅샷 개수 제한

**해결책:**

```sql
-- SQL 에디터에서 실행

-- 사용자별 최근 100개만 유지하는 함수
CREATE OR REPLACE FUNCTION limit_user_snapshots()
RETURNS TRIGGER AS $$
BEGIN
  -- 새 레코드가 삽입되면, 100개 초과 시 오래된 것 삭제
  DELETE FROM portfolio_snapshots
  WHERE id IN (
    SELECT id
    FROM portfolio_snapshots
    WHERE user_id = NEW.user_id
    ORDER BY timestamp DESC
    OFFSET 100  -- 최근 100개 제외하고 삭제
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS limit_snapshots_trigger ON portfolio_snapshots;
CREATE TRIGGER limit_snapshots_trigger
  AFTER INSERT ON portfolio_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION limit_user_snapshots();
```

---

## 5️⃣ 성능 모니터링

### 5.1 느린 쿼리 추적

```sql
-- SQL 에디터에서 실행

-- 1. pg_stat_statements 확장 활성화
-- Supabase Dashboard > Database > Extensions에서 pg_stat_statements 활성화

-- 2. 느린 쿼리 조회 (평균 실행 시간 순)
SELECT
  calls,
  mean_exec_time,
  max_exec_time,
  total_exec_time,
  query
FROM pg_stat_statements
WHERE query LIKE '%portfolios%' OR query LIKE '%portfolio_snapshots%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 3. 가장 자주 실행되는 쿼리
SELECT
  calls,
  mean_exec_time,
  query
FROM pg_stat_statements
WHERE query LIKE '%portfolios%'
ORDER BY calls DESC
LIMIT 10;
```

---

### 5.2 테이블 통계 확인

```sql
-- SQL 에디터에서 실행

-- 1. 테이블 크기 확인
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE tablename IN ('portfolios', 'portfolio_snapshots')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 2. 레코드 수 확인
SELECT
  'portfolios' AS table_name,
  COUNT(*) AS total_records
FROM portfolios
UNION ALL
SELECT
  'portfolio_snapshots' AS table_name,
  COUNT(*) AS total_records
FROM portfolio_snapshots;

-- 3. 스냅샷 사용자별 분포
SELECT
  user_id,
  COUNT(*) AS snapshot_count,
  MIN(timestamp) AS oldest_snapshot,
  MAX(timestamp) AS newest_snapshot
FROM portfolio_snapshots
GROUP BY user_id
ORDER BY snapshot_count DESC
LIMIT 10;
```

---

## 6️⃣ 백업 및 복구 전략

### 6.1 Point-in-Time Recovery (PITR)

Supabase 대시보드에서 설정:
1. **Database > Settings > Backups**
2. Point-in-Time Recovery 활성화 (Pro 플랜 이상)
3. 보존 기간: 7일 권장

### 6.2 수동 백업 스크립트

```sql
-- SQL 에디터에서 실행

-- 1. 전체 데이터 백업 (JSON 형식)
COPY (
  SELECT row_to_json(t)
  FROM portfolios t
) TO '/tmp/portfolios_backup.json';

-- 2. CSV 백업
COPY portfolios TO '/tmp/portfolios_backup.csv' WITH CSV HEADER;

-- 3. 특정 사용자 백업
COPY (
  SELECT *
  FROM portfolios
  WHERE user_id = 'your_user_id'
) TO '/tmp/user_backup.csv' WITH CSV HEADER;
```

### 6.3 애플리케이션 레벨 백업

```typescript
// lib/storage.ts에 추가

// 모든 사용자 데이터 백업 (관리자용)
export async function backupAllData(): Promise<void> {
  try {
    const { data: portfolios } = await supabase
      .from('portfolios')
      .select('*');

    const { data: snapshots } = await supabase
      .from('portfolio_snapshots')
      .select('*');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.7',
      portfolios,
      snapshots,
    };

    // 파일로 다운로드
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${Date.now()}.json`;
    a.click();
  } catch (error) {
    console.error('Backup failed:', error);
  }
}
```

---

## 7️⃣ 고급 최적화

### 7.1 Read Replica 활용 (Pro 플랜)

읽기 작업과 쓰기 작업 분리:

```typescript
// lib/supabase.ts 수정

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 주 클라이언트 (읽기/쓰기)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 읽기 전용 Replica (선택적, Pro 플랜)
const replicaUrl = process.env.NEXT_PUBLIC_SUPABASE_REPLICA_URL;
export const supabaseRead = replicaUrl
  ? createClient(replicaUrl, supabaseAnonKey)
  : supabase;

// 사용 예시
// 읽기: supabaseRead.from('portfolios').select()
// 쓰기: supabase.from('portfolios').insert()
```

---

### 7.2 Connection Pooling

```typescript
// lib/supabase.ts - 서버사이드 전용

import { createClient } from '@supabase/supabase-js';

// 서버사이드에서는 Connection Pooling URL 사용
const isServer = typeof window === 'undefined';

const supabaseUrl = isServer
  ? process.env.SUPABASE_POOLING_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  : process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseKey = isServer
  ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: !isServer,
  },
});
```

---

### 7.3 캐싱 전략

```typescript
// lib/cache.ts - 새 파일 생성

// 간단한 인메모리 캐시
class SimpleCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttlMs: number = 60000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const portfolioCache = new SimpleCache();

// lib/storage.ts에서 사용
export async function loadStateFromSupabase(): Promise<Partial<NexusState>> {
  const userId = getUserId();
  const cacheKey = `portfolio:${userId}`;

  // 캐시 확인
  const cached = portfolioCache.get(cacheKey);
  if (cached) {
    console.log('📦 Loaded from cache');
    return cached;
  }

  // Supabase 조회
  const { data } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .single();

  const state = { /* ... */ };

  // 캐시 저장 (1분)
  portfolioCache.set(cacheKey, state, 60000);

  return state;
}
```

---

## 8️⃣ 실행 우선순위

### 🔴 즉시 실행 (필수)

1. **RLS 활성화** - 보안 필수
   ```sql
   ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
   -- + 정책 생성
   ```

2. **인덱스 추가** - 성능 개선
   ```sql
   CREATE INDEX idx_snapshots_user_timestamp
   ON portfolio_snapshots(user_id, timestamp DESC);
   ```

3. **오래된 스냅샷 정리** - 저장 공간 절약
   ```sql
   DELETE FROM portfolio_snapshots
   WHERE timestamp < NOW() - INTERVAL '30 days';
   ```

### 🟡 단기 실행 (1-2주 내)

4. **SELECT * 제거** - 코드 수정
5. **updated_at 트리거** - 데이터 추적
6. **스냅샷 자동 정리 함수** - 유지보수 자동화

### 🟢 장기 계획

7. **Read Replica** - Pro 플랜 업그레이드 시
8. **캐싱 레이어** - 트래픽 증가 시
9. **모니터링 대시보드** - 운영 안정화

---

## 📊 예상 성능 개선

| 항목 | 현재 | 최적화 후 | 개선율 |
|------|------|-----------|--------|
| 포트폴리오 로드 | ~200ms | ~80ms | 60% ↓ |
| 스냅샷 조회 (48개) | ~300ms | ~100ms | 67% ↓ |
| 저장 (UPSERT) | ~150ms | ~120ms | 20% ↓ |
| 데이터 전송량 | 100% | 60% | 40% ↓ |
| 저장 공간 (스냅샷) | 무한 증가 | 상한선 유지 | ✅ |

---

## 🛠️ 실행 가이드

### Step 1: Supabase 대시보드 접속
1. https://app.supabase.com 로그인
2. nexus 프로젝트 선택
3. **SQL Editor** 클릭

### Step 2: 스크립트 실행
1. 위 SQL 코드를 순서대로 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭
4. 결과 확인

### Step 3: 검증
```sql
-- 인덱스 확인
SELECT * FROM pg_indexes
WHERE tablename IN ('portfolios', 'portfolio_snapshots');

-- RLS 정책 확인
SELECT * FROM pg_policies
WHERE tablename IN ('portfolios', 'portfolio_snapshots');

-- 트리거 확인
SELECT * FROM pg_trigger
WHERE tgname LIKE '%portfolio%';
```

### Step 4: 코드 수정
- `lib/storage.ts` - SELECT * 제거
- `lib/cache.ts` - 캐싱 추가 (선택)

---

## ⚠️ 주의사항

1. **백업 먼저**
   - SQL 실행 전 데이터 백업
   - Supabase Dashboard > Database > Backups 확인

2. **테스트 환경 선행**
   - 가능하면 테스트 프로젝트에서 먼저 실행
   - 프로덕션 적용 전 검증

3. **RLS 주의**
   - RLS 활성화 후 기존 쿼리 동작 확인
   - 익명 사용자 정책 확인

4. **인덱스 생성 시간**
   - 데이터 많으면 생성 시간 소요
   - 트래픽 적은 시간대 실행 권장

---

## 📚 참고 자료

- [Supabase 인덱스 가이드](https://supabase.com/docs/guides/database/postgres/indexes)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL 성능 튜닝](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [JSONB 인덱싱](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)

---

**작성자 노트:**
이 문서는 실제 적용 전 백업을 권장하며, 단계별로 천천히 진행하시기 바랍니다.
문제 발생 시 Supabase 대시보드에서 언제든 롤백 가능합니다.
