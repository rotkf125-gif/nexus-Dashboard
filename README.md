# 🌟 NEXUS DASHBOARD v1.2

개인 투자 포트폴리오 관리 대시보드

## 🔗 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## ✨ v1.0 주요 기능

### 📊 탭 기반 내비게이션
5개의 독립적인 섹션으로 구성된 사이드바 네비게이션:
- **Stellar Assets** (Cyan): 전체 자산 관리 테이블
- **Income Stream** (Gold): 배당 수익 분석 및 예측
- **Analytics** (Purple): 리스크 분석 및 포트폴리오 인사이트
- **Performance** (Green): 벤치마크 대비 성과 추적
- **Simulation** (Orange): What-If 및 리밸런싱 시뮬레이터

### 🎨 UI/UX 개선
- **Seamless 사이드바**: 투명 배경으로 메인 콘텐츠와 자연스러운 연결
- **탭별 컬러 시스템**: 각 탭마다 고유 색상으로 시각적 구분
- **최적화된 Typography**: 박스 크기에 맞춘 글자 크기 및 간격
- **균등 레이아웃**: Row별 박스 높이 통일 (280px)

### 💰 Income Stream 재구성
- **Row 1 (4개 균등 배치)**: PLTY | HOOY | EST. WEEKLY | RECENT LOGS
  - 종목 카드: 1열 세로 레이아웃, 종목명 18px 강조
  - EST. WEEKLY: 메인 금액 36px (semibold)
  - RECENT LOGS: 10px + semibold, 최근 5개 로그
- **Row 2 (2개 균등 배치)**: DPS TREND | LEARNING
  - 차트 높이 140px, 균등 분할

### 📈 Performance 탭
- **PerformanceArena (1/4)**: 420px 고정 높이
  - YTD Return, VS S&P/QQQ, Ranking, Benchmarks
- **Historic Performance (3/4)**: 420px 고정 높이
  - 24H/1W/1M 기간 선택
  - 듀얼 Y축 차트 (Total Value + Return %)

### 🛡️ Analytics (한글화 완료)
3행 x 4열 그리드 레이아웃:
- **Row 1**: 총 평가액 | 비중 | 섹터 | 유형
- **Row 2**: 리스크 점수 | 리스크 요인 | 수익률
- **Row 3**: 시장 상관관계 | 리스크 프로필 | 인사이트

### 📊 Stellar Assets
- Type별 그룹화 테이블 (접이식)
- 균등 열 간격 (table-fixed)
- Compact 모드 토글
- Delta 지표 표시
- **Return 컬럼**: 수익금 + (수익률 %) 2줄 표시
- **손익 배경 효과**: 수익 종목(에메랄드), 손실 종목(로즈) 그라데이션
- **가격 변화 인디케이터**: API 호출 시 Price 옆에 변화율 표시 (▲/▼)
- **컬럼 그룹화**: Val($)↔Val(₩), FX Rate↔FX P/L 간격 최적화

---

## 🚀 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. 개발 서버 실행
```bash
npm run dev
```
http://localhost:3000 접속

### 4. 프로덕션 빌드
```bash
npm run build
npm run start
```

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

### Google OAuth 설정
1. Supabase Dashboard → Authentication → Providers → Google
2. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
3. Redirect URI: `https://xxx.supabase.co/auth/v1/callback`

---

## 🔧 API Routes

### GET /api/price/[ticker]
실시간 주가 조회 (Yahoo Finance)
```json
{
  "ticker": "AAPL",
  "price": 178.52,
  "previousClose": 177.30,
  "change": 1.22,
  "changePercent": 0.69,
  "marketState": "REGULAR"
}
```

### GET /api/market
주요 지수 조회 (24시간 데이터)
```json
{
  "nasdaq": 19500,
  "sp500": 6000,
  "vix": 14.20,
  "tnx": 4.25,
  "krw": 1435,
  "marketState": "REGULAR"
}
```

### GET /api/widget?uid=xxx
Android Tasker/KWGT 위젯용 API
```json
{
  "timestamp": 1704412800000,
  "totalValue": 12500.50,
  "totalValueKRW": 18125725,
  "todayReturn": 125.30,
  "todayReturnPct": 1.01,
  "topHoldings": [...],
  "marketState": "REGULAR",
  "exchangeRate": 1450
}
```

---

## 📁 프로젝트 구조

```
nexus-next/
├── app/
│   ├── page.tsx              # 메인 대시보드
│   ├── layout.tsx            # 루트 레이아웃
│   └── api/
│       ├── market/route.ts   # 지수 API
│       ├── benchmark/route.ts# 벤치마크 API
│       ├── widget/route.ts   # Widget API
│       ├── info/[ticker]/route.ts # 종목 정보 API
│       └── price/[ticker]/route.ts # 실시간 주가 API
├── components/
│   ├── Header.tsx            # 헤더 (시장 상태, 인증)
│   ├── StrategyBar.tsx       # 전략 메모
│   ├── AssetTable.tsx        # Type별 그룹화 테이블
│   ├── AssetModal.tsx        # 자산 추가/수정
│   ├── IncomeStream.tsx      # 배당 분석 (Row 1+2)
│   ├── PredictedDividend.tsx # 배당 예측
│   ├── Analytics.tsx         # 리스크 분석 (3x4 그리드)
│   ├── PerformanceArena.tsx  # 벤치마크 비교
│   ├── HistoricPerformance.tsx # 히스토릭 차트
│   ├── SimulationHub.tsx     # What-If + Rebalance
│   ├── AuthModal.tsx         # 로그인/회원가입
│   ├── DividendModal.tsx     # 배당 기록
│   └── SettingsModal.tsx     # 설정 (Export/Import)
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── storage.ts            # 스토리지 + 스냅샷
│   ├── context.tsx           # 전역 상태 관리
│   ├── types.ts              # TypeScript 타입
│   ├── config.ts             # 설정 상수
│   └── utils.ts              # 유틸리티 함수
└── styles/
    └── globals.css           # Celestial Glass 테마
```

---

## 📱 모바일 동기화

### 방법 1: URL 공유
1. PC에서 👤 아이콘 클릭
2. 하단 "모바일 공유 링크" 복사
3. 모바일에서 해당 링크 접속

### 방법 2: Google 로그인
1. PC/모바일 모두 같은 Google 계정으로 로그인
2. 자동 동기화

---

## 🎨 테마 커스터마이징

### Tailwind 색상 (`tailwind.config.js`)
```javascript
colors: {
  'celestial-cyan': '#00d4ff',
  'celestial-gold': '#ffd700',
  'celestial-purple': '#b388ff',
  'v64-success': '#69F0AE',
  'v64-danger': '#FF5252',
  'v64-warning': '#FFD740',
}
```

---

## 📝 Git 명령어

```bash
# 변경사항 커밋 & 푸시
git add .
git commit -m "v1.0: 커밋 메시지"
git push origin main

# Vercel 자동 배포됨
```

---

## 🆘 문제 해결

### npm install 오류
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Vercel 빌드 실패
- Vercel Dashboard → Deployments → Build Logs 확인
- TypeScript 타입 오류 수정

### Supabase 연결 실패
- 환경 변수 확인 (NEXT_PUBLIC_ 접두사 필수)
- Vercel에서 환경 변수 설정 후 Redeploy

---

## 📞 기술 스택

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Charts**: Chart.js
- **Hosting**: Vercel
- **API**: Yahoo Finance

---

## 📄 버전 히스토리

| 버전 | 날짜 | 주요 변경 |
|------|------|----------|
| v1.2 | 2026-01-13 | 🔧 컬럼 그룹핑 개선 (Avg+Price, Val$+Val₩, FX Rate+FX P/L 간격 최적화) |
| v1.1 | 2026-01-13 | 📊 Return 컬럼 개선 (수익금+%), 🎨 손익별 배경 효과, 📈 가격 변화 인디케이터, 🔧 컬럼 간격 최적화 |
| v1.0 | 2026-01-13 | 📱 탭 기반 네비게이션, 📊 Income Stream 4+2 레이아웃, 🎨 한글화, 🔧 Typography 최적화 |

---

## 📄 라이선스

Private Project - Personal Use Only
