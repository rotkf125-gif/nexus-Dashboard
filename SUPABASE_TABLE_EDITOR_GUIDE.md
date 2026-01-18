# Supabase Table Editor 사용 가이드

> 작성일: 2026-01-18
> 대상: SQL에 익숙하지 않은 사용자
> 목적: GUI로 데이터베이스 최적화하기

---

## 📋 Table Editor란?

Supabase의 **Table Editor**는 SQL을 직접 작성하지 않고도 GUI로 테이블을 관리할 수 있는 기능입니다.

**접근 방법:**
1. Supabase Dashboard (https://app.supabase.com)
2. 프로젝트 선택
3. 왼쪽 메뉴 > **Table Editor** 클릭

---

## 1️⃣ 테이블 구조 확인 및 수정

### 1.1 portfolios 테이블 확인

**Table Editor에서:**
1. 왼쪽에서 `portfolios` 테이블 선택
2. 상단 탭에서 **"Columns"** 클릭
3. 현재 컬럼 구조 확인

**확인 항목:**

| 컬럼명 | 타입 | Nullable | Default | 용도 |
|--------|------|----------|---------|------|
| id | int8 | No | auto | Primary Key |
| user_id | text | No | - | 사용자 식별자 |
| assets | jsonb | Yes | - | 보유 자산 |
| dividends | jsonb | Yes | - | 배당금 내역 |
| trade_logs | jsonb | Yes | - | 거래 기록 |
| trade_sums | jsonb | Yes | - | 거래 합계 |
| market | jsonb | Yes | - | 시장 데이터 |
| exchange_rate | numeric | Yes | - | 환율 |
| strategy | text | Yes | - | 전략 메모 |
| compact_mode | bool | Yes | false | 화면 모드 |
| theme | text | Yes | 'dark' | 테마 설정 |
| created_at | timestamptz | No | now() | 생성일 |
| updated_at | timestamptz | No | now() | 수정일 |

---

### 1.2 컬럼 추가 (선택적)

**새 컬럼 추가 방법:**

1. `portfolios` 테이블 선택
2. **"+ New Column"** 버튼 클릭
3. 다음 정보 입력:

**예시: 마지막 동기화 시간 추가**
```
Name: last_sync_at
Type: timestamptz
Default Value: now()
Is Nullable: Yes
Is Unique: No
Is Primary Key: No
```

4. **Save** 클릭

---

### 1.3 기본값(Default Value) 설정

**updated_at 자동 업데이트 설정:**

1. `portfolios` 테이블 > Columns 탭
2. `updated_at` 컬럼 찾기
3. 컬럼 클릭 > **Edit** 아이콘
4. Default Value에 `now()` 입력 (이미 설정되어 있으면 Pass)
5. **Save**

---

## 2️⃣ 인덱스 생성 (GUI)

### 2.1 Indexes 탭 사용

**인덱스 추가 방법:**

1. `portfolio_snapshots` 테이블 선택
2. 상단 탭 > **"Indexes"** 클릭
3. **"Create Index"** 버튼 클릭

**인덱스 설정 1: 사용자별 타임스탬프**
```
Index Name: idx_snapshots_user_timestamp
Table: portfolio_snapshots
Columns:
  - user_id (선택)
  - timestamp (선택) → DESC 체크 ✓
Type: B-tree
Unique: No
```

**인덱스 설정 2: JSONB 인덱스**
```
Index Name: idx_portfolios_assets_gin
Table: portfolios
Columns:
  - assets (선택)
Type: GIN
Unique: No
```

4. **Create Index** 클릭

---

### 2.2 기존 인덱스 확인

**Indexes 탭에서 확인할 항목:**
- ✅ Primary Key 인덱스 (자동 생성)
- ✅ user_id Unique 제약 (portfolios)
- ✅ 복합 인덱스 (user_id + timestamp)

**인덱스가 있으면:**
- 초록색 체크 표시
- Index name 표시됨

**인덱스가 없으면:**
- 위 2.1 단계로 생성

---

## 3️⃣ Constraints (제약 조건) 설정

### 3.1 Foreign Key 설정 (필요시)

`portfolio_snapshots`가 `portfolios`를 참조하도록 설정:

1. `portfolio_snapshots` 테이블 선택
2. **"Foreign Keys"** 탭 클릭
3. **"Add Foreign Key"** 버튼

**설정값:**
```
Name: fk_snapshots_user
Source Schema: public
Source Table: portfolio_snapshots
Source Column: user_id

Target Schema: public
Target Table: portfolios
Target Column: user_id

On Delete: CASCADE (사용자 삭제 시 스냅샷도 삭제)
On Update: CASCADE
```

4. **Save** 클릭

---

### 3.2 Check Constraints

데이터 유효성 검증 추가:

1. `portfolios` 테이블 선택
2. **"Constraints"** 탭 (없으면 SQL Editor 사용)

**예시: exchange_rate 범위 제한**
```sql
-- SQL Editor에서 실행
ALTER TABLE portfolios
ADD CONSTRAINT check_exchange_rate_positive
CHECK (exchange_rate > 0 AND exchange_rate < 10000);
```

---

## 4️⃣ RLS (Row Level Security) 설정

### 4.1 RLS 활성화

**GUI에서 활성화:**

1. `portfolios` 테이블 선택
2. 우측 상단 **"..."** 메뉴 클릭
3. **"Edit Table"** 선택
4. **"Enable Row Level Security"** 토글 ON ✅
5. **Save**

---

### 4.2 정책(Policy) 추가

**Authentication > Policies 메뉴에서:**

1. 왼쪽 메뉴 > **Authentication** > **Policies** 클릭
2. `portfolios` 테이블 찾기
3. **"New Policy"** 버튼 클릭

**정책 1: SELECT (조회) 권한**
```
Policy Name: Users can view own portfolio
Command: SELECT
Target roles: authenticated, anon

Using expression:
(auth.uid()::text = user_id) OR (user_id LIKE 'user_%')
```

**정책 2: INSERT (삽입) 권한**
```
Policy Name: Users can create own portfolio
Command: INSERT
Target roles: authenticated, anon

With check expression:
(auth.uid()::text = user_id) OR (user_id LIKE 'user_%')
```

**정책 3: UPDATE (수정) 권한**
```
Policy Name: Users can update own portfolio
Command: UPDATE
Target roles: authenticated, anon

Using expression:
(auth.uid()::text = user_id) OR (user_id LIKE 'user_%')

With check expression:
(auth.uid()::text = user_id) OR (user_id LIKE 'user_%')
```

**정책 4: DELETE (삭제) 권한**
```
Policy Name: Users can delete own portfolio
Command: DELETE
Target roles: authenticated, anon

Using expression:
(auth.uid()::text = user_id) OR (user_id LIKE 'user_%')
```

4. 각 정책 저장

---

### 4.3 RLS 정책 테스트

**테스트 방법:**

1. Table Editor > `portfolios` 테이블
2. **"View Data"** 탭
3. 필터 추가: `user_id = 'test_user'`
4. 데이터가 정상적으로 필터링되는지 확인

---

## 5️⃣ 데이터 관리

### 5.1 데이터 직접 수정

**Table Editor에서 데이터 편집:**

1. `portfolios` 테이블 > **"Data"** 탭
2. 수정할 행 찾기
3. 셀 클릭 > 값 수정
4. Enter 키 누르면 자동 저장

**주의사항:**
- JSONB 컬럼은 유효한 JSON 형식이어야 함
- 잘못된 값 입력 시 에러 발생

---

### 5.2 데이터 필터링

**필터 추가:**
1. **Data** 탭
2. 상단 **"Filters"** 버튼 클릭
3. 조건 추가:
   ```
   Column: user_id
   Operator: equals
   Value: user_abc123
   ```
4. **Apply** 클릭

---

### 5.3 데이터 정렬

**정렬 방법:**
1. 컬럼 헤더 클릭
2. 화살표 아이콘으로 오름차순/내림차순 전환

---

### 5.4 레코드 삭제

**행 삭제:**
1. 삭제할 행 선택 (왼쪽 체크박스)
2. 상단 **"Delete"** 버튼 클릭
3. 확인 팝업에서 **"Confirm"** 클릭

**주의: 복구 불가능하므로 신중히!**

---

## 6️⃣ 데이터 Import/Export

### 6.1 CSV로 데이터 Export

**내보내기:**
1. `portfolios` 테이블 > Data 탭
2. 우측 상단 **"..."** 메뉴
3. **"Export to CSV"** 선택
4. 파일 다운로드

---

### 6.2 CSV로 데이터 Import

**가져오기:**
1. `portfolios` 테이블 > Data 탭
2. 우측 상단 **"..."** 메뉴
3. **"Import data from CSV"** 선택
4. CSV 파일 선택
5. 컬럼 매핑 확인
6. **Import** 클릭

**CSV 형식 예시:**
```csv
user_id,exchange_rate,strategy,theme
user_test1,1450,"Long-term",dark
user_test2,1452,"Dividend",light
```

---

## 7️⃣ 테이블 생성 (새 테이블)

### 7.1 GUI로 테이블 생성

**예시: 사용자 설정 테이블 추가**

1. Table Editor > **"New Table"** 버튼 클릭
2. 설정:

```
Table Name: user_settings
Schema: public
Description: User preferences and settings

Enable Row Level Security: ✓ ON
Enable Realtime: ✗ OFF (선택적)
```

3. **Columns** 섹션에서 컬럼 추가:

| Name | Type | Default | Primary | Nullable |
|------|------|---------|---------|----------|
| id | int8 | identity | ✓ | No |
| user_id | text | - | - | No |
| refresh_interval | int4 | 5 | - | Yes |
| notifications_enabled | bool | true | - | Yes |
| created_at | timestamptz | now() | - | No |
| updated_at | timestamptz | now() | - | No |

4. **Save** 클릭

---

### 7.2 Relationships 설정

**외래 키 추가:**
1. 생성된 테이블에서 **Foreign Keys** 탭
2. `user_id` → `portfolios.user_id` 연결
3. On Delete: CASCADE 설정

---

## 8️⃣ 유용한 팁

### 8.1 빠른 검색

**Table Editor에서:**
- `Ctrl + K` (Windows) / `Cmd + K` (Mac)
- 테이블명 또는 컬럼명 입력
- 빠른 이동

---

### 8.2 데이터 복사

**행 복사:**
1. 행 선택
2. 우클릭 > **"Duplicate Row"**
3. 수정 후 저장

---

### 8.3 JSON 데이터 보기

**JSONB 컬럼 예쁘게 보기:**
1. JSONB 셀 클릭
2. 자동으로 JSON 뷰어 팝업
3. 트리 구조로 탐색 가능
4. 직접 수정 가능

---

### 8.4 SQL Preview

**GUI 작업을 SQL로 확인:**
1. 컬럼 추가/수정 시
2. 하단에 **"Preview SQL"** 버튼 표시
3. 클릭하면 실행될 SQL 확인 가능
4. 학습 목적으로 유용!

---

## 9️⃣ 실전 체크리스트

### ✅ 초기 설정 (프로젝트 시작 시)

- [ ] `portfolios` 테이블 RLS 활성화
- [ ] `portfolio_snapshots` 테이블 RLS 활성화
- [ ] user_id 인덱스 확인
- [ ] timestamp 인덱스 생성
- [ ] Foreign Key 설정 (snapshots → portfolios)
- [ ] RLS 정책 4개 생성 (SELECT, INSERT, UPDATE, DELETE)

---

### ✅ 정기 점검 (월 1회)

- [ ] 데이터 크기 확인
  - Table Editor > 우측 상단 Info 아이콘
  - Table size, Row count 확인
- [ ] 오래된 스냅샷 삭제
  - `portfolio_snapshots` > 30일 이상 필터링 > 삭제
- [ ] 백업 확인
  - Dashboard > Database > Backups
- [ ] 인덱스 상태 확인
  - Indexes 탭에서 모든 인덱스 정상인지 확인

---

### ✅ 문제 발생 시

**데이터가 보이지 않을 때:**
1. RLS 정책 확인
2. user_id 필터 확인
3. SQL Editor에서 직접 조회
   ```sql
   SELECT * FROM portfolios LIMIT 10;
   ```

**저장이 안 될 때:**
1. RLS INSERT 정책 확인
2. NOT NULL 제약 확인
3. JSONB 형식 확인

**느릴 때:**
1. Indexes 탭에서 인덱스 확인
2. Table 크기 확인 (100MB 이상이면 최적화 필요)
3. `SUPABASE_OPTIMIZATION.md` 참조

---

## 🔟 고급 기능

### 10.1 Triggers 설정

**GUI에서 Trigger 생성:**

1. Table Editor > `portfolios` 테이블
2. 상단 메뉴 > **"Triggers"** (없으면 Database > Triggers)
3. **"Create Trigger"** 버튼

**예시: updated_at 자동 업데이트**
```
Trigger Name: set_updated_at
Table: portfolios
Events: UPDATE
Timing: BEFORE
Orientation: ROW

Function: (SQL Editor에서 먼저 함수 생성 필요)
```

**함수 생성 (SQL Editor):**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 10.2 Realtime 구독

**실시간 데이터 동기화 활성화:**

1. `portfolios` 테이블 선택
2. 우측 상단 **"..."** > **"Edit Table"**
3. **"Enable Realtime"** 토글 ON
4. **Save**

**클라이언트에서 구독:**
```typescript
// lib/supabase.ts에서 사용
const subscription = supabase
  .channel('portfolio-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'portfolios',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Change received!', payload);
    // 상태 업데이트
  })
  .subscribe();
```

---

### 10.3 Views 생성

**복잡한 쿼리를 View로 저장:**

1. SQL Editor에서 실행:
```sql
CREATE OR REPLACE VIEW user_portfolio_summary AS
SELECT
  p.user_id,
  p.exchange_rate,
  jsonb_array_length(p.assets) AS asset_count,
  jsonb_array_length(p.dividends) AS dividend_count,
  p.updated_at
FROM portfolios p;
```

2. Table Editor에서 `user_portfolio_summary` View 확인
3. 일반 테이블처럼 조회 가능 (읽기 전용)

---

## 📚 참고 링크

- [Supabase Table Editor 공식 문서](https://supabase.com/docs/guides/database/tables)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Indexes 최적화](https://supabase.com/docs/guides/database/postgres/indexes)
- [Triggers 가이드](https://supabase.com/docs/guides/database/postgres/triggers)

---

## ⚠️ 주의사항

### 절대 하지 말 것:

1. **Primary Key 삭제** - 테이블 복구 불가
2. **RLS 비활성화** - 보안 위험
3. **프로덕션에서 실험** - 테스트 프로젝트 사용
4. **대량 삭제** - 백업 없이 DELETE 금지

### 권장 사항:

1. **백업 먼저** - 중요 작업 전 항상 백업
2. **테스트 먼저** - 테스트 데이터로 먼저 시도
3. **문서화** - 변경 사항 기록
4. **단계별 진행** - 한 번에 한 가지씩

---

**Happy Database Management! 🚀**

문제 발생 시 `SUPABASE_OPTIMIZATION.md` 또는 Supabase 공식 문서를 참조하세요.
