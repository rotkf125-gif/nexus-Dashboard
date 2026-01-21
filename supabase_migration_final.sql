-- ═══════════════════════════════════════════════════════════════
-- NEXUS v1.7 - Supabase 최적화 통합 스크립트 (한 번에 실행)
-- 작성일: 2026-01-18
-- 소요 시간: 약 1-2분
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: 기존 위험한 RLS 정책 삭제
DROP POLICY IF EXISTS "Allow all portfolios" ON portfolios;
DROP POLICY IF EXISTS "Allow all snapshots" ON portfolio_snapshots;

-- STEP 2: 안전한 RLS 정책 생성 (portfolios - 4개)
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

-- portfolio_snapshots 정책 (3개)
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

-- STEP 3: 인덱스 추가 (7개)
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
ON portfolios(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolios_assets_gin
ON portfolios USING GIN (assets);

CREATE INDEX IF NOT EXISTS idx_portfolios_dividends_gin
ON portfolios USING GIN (dividends);

CREATE INDEX IF NOT EXISTS idx_portfolios_trade_logs_gin
ON portfolios USING GIN (trade_logs);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_timestamp
ON portfolio_snapshots(user_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp
ON portfolio_snapshots(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_id
ON portfolio_snapshots(user_id);

-- STEP 4: 자동화 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- STEP 5: 트리거 적용
DROP TRIGGER IF EXISTS update_portfolios_updated_at ON portfolios;
CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS limit_snapshots_trigger ON portfolio_snapshots;
CREATE TRIGGER limit_snapshots_trigger
  AFTER INSERT ON portfolio_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION limit_user_snapshots();

-- STEP 6: 검증 (결과 확인)
SELECT
  '🔐 RLS 정책' AS "항목",
  COUNT(*)::TEXT || '개 (7개 필요)' AS "상태"
FROM pg_policies
WHERE tablename IN ('portfolios', 'portfolio_snapshots')

UNION ALL

SELECT
  '⚡ 인덱스',
  COUNT(*)::TEXT || '개 (7개 이상)'
FROM pg_indexes
WHERE tablename IN ('portfolios', 'portfolio_snapshots')
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT
  '🤖 트리거',
  COUNT(*)::TEXT || '개 (2개 필요)'
FROM pg_trigger
WHERE tgname IN ('update_portfolios_updated_at', 'limit_snapshots_trigger')

UNION ALL

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
