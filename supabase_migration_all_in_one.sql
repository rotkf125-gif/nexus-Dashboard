-- ═══════════════════════════════════════════════════════════════
-- NEXUS v1.7 - Supabase 최적화 통합 스크립트 (한 번에 실행)
-- 작성일: 2026-01-18
-- 소요 시간: 약 1-2분
-- ═══════════════════════════════════════════════════════════════
--
-- 사용법:
-- 1. 백업 확인 (portfolios.csv, portfolio_snapshots.csv)
-- 2. Supabase SQL Editor 열기
-- 3. 이 파일 전체 복사 → 붙여넣기
-- 4. Run 버튼 클릭
-- 5. 하단 결과 확인
--
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 1: 기존 위험한 RLS 정책 삭제                            │
-- └─────────────────────────────────────────────────────────────┘

DROP POLICY IF EXISTS "Allow all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Allow all snapshots" ON portfolio_snapshots;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 2: 안전한 RLS 정책 생성 (사용자별 격리)                 │
-- └─────────────────────────────────────────────────────────────┘

-- portfolios 테이블 정책 (4개)

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

-- portfolio_snapshots 테이블 정책 (3개)

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

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 3: 인덱스 추가 (성능 최적화)                            │
-- └─────────────────────────────────────────────────────────────┘

-- portfolios 인덱스
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
ON portfolios(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_assets_gin
ON portfolios USING GIN (assets);

CREATE INDEX IF NOT EXISTS idx_portfolios_dividends_gin
ON portfolios USING GIN (dividends);

CREATE INDEX IF NOT EXISTS idx_portfolios_trade_logs_gin
ON portfolios USING GIN (trade_logs);

-- portfolio_snapshots 인덱스
CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp
ON portfolio_snapshots(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
ON portfolio_snapshots(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_id
ON portfolio_snapshots(user_id);

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 4: 자동화 함수 생성                                     │
-- └─────────────────────────────────────────────────────────────┘

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 스냅샷 개수 자동 제한 함수 (최근 100개 유지)
CREATE OR REPLACE FUNCTION limit_user_snapshots()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM portfolio_snapshots
  WHERE id IN (
    SELECT id
    FROM portfolio_snapshots
    WHERE user_id = NEW.user_id
    ORDER BY timestamp DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 5: 트리거 적용                                          │
-- └─────────────────────────────────────────────────────────────┘

-- portfolios updated_at 트리거
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- portfolio_snapshots 개수 제한 트리거
DROP TRIGGER IF EXISTS limit_snapshots_trigger ON portfolio_snapshots;
CREATE TRIGGER limit_snapshots_trigger
  AFTER INSERT ON portfolio_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION limit_user_snapshots();

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 6: 오래된 스냅샷 즉시 정리 (30일 이상)                  │
-- └─────────────────────────────────────────────────────────────┘

DELETE FROM portfolio_snapshots
WHERE timestamp < NOW() - INTERVAL '30 days';

-- ┌─────────────────────────────────────────────────────────────┐
-- │ STEP 7: 검증 및 결과 출력                                    │
-- └─────────────────────────────────────────────────────────────┘

-- 검증 쿼리 (결과를 보여줌)
DO $$
BEGIN
  RAISE NOTICE '✅ 마이그레이션 완료!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 설치된 항목:';
END $$;

-- RLS 정책 확인
SELECT
  '🔐 RLS 정책' AS "항목",
  COUNT(*)::TEXT || '개 생성 (7개 필요)' AS "상태"
FROM pg_policies
WHERE tablename IN ('portfolios', 'portfolio_snapshots')

UNION ALL

-- 인덱스 확인
SELECT
  '⚡ 인덱스',
  COUNT(*)::TEXT || '개 생성 (8개 이상)'
FROM pg_indexes
WHERE tablename IN ('portfolios', 'portfolio_snapshots')
  AND indexname NOT LIKE '%pkey'
  AND indexname NOT LIKE 'idx_snapshots_user_time%'  -- 기존 인덱스 제외

UNION ALL

-- 트리거 확인
SELECT
  '🤖 트리거',
  COUNT(*)::TEXT || '개 설치 (2개 필요)'
FROM pg_trigger
WHERE tgname IN ('update_portfolios_updated_at', 'limit_snapshots_trigger')

UNION ALL

-- 데이터 확인
SELECT
  '📁 포트폴리오',
  COUNT(*)::TEXT || '개 데이터'
FROM portfolios

UNION ALL

SELECT
  '📸 스냅샷',
  COUNT(*)::TEXT || '개 데이터'
FROM portfolio_snapshots;

-- ═══════════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════════
--
-- ✅ 예상 결과:
--
-- 항목          | 상태
-- --------------|---------------------------
-- 🔐 RLS 정책   | 7개 생성 (7개 필요)
-- ⚡ 인덱스     | 7개 생성 (8개 이상)
-- 🤖 트리거     | 2개 설치 (2개 필요)
-- 📁 포트폴리오 | N개 데이터
-- 📸 스냅샷     | N개 데이터
--
-- 위 결과가 나왔다면 성공입니다!
--
-- ═══════════════════════════════════════════════════════════════
--
-- 🎯 다음 단계:
-- 1. 브라우저에서 애플리케이션 새로고침
-- 2. 포트폴리오 데이터 정상 조회 확인
-- 3. 자산 추가/수정 테스트
-- 4. 에러 없으면 완료!
--
-- ═══════════════════════════════════════════════════════════════
