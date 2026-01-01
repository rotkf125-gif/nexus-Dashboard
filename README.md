[README.md](https://github.com/user-attachments/files/24377474/README.md)
# 🌟 NEXUS CELESTIAL V64.2 - Next.js Edition

개인 투자 포트폴리오 대시보드 (Celestial Glass 테마)

## 🔗 배포 정보

| 항목 | URL |
|------|-----|
| **Live Site** | https://nexus-dashboard-beige.vercel.app |
| **GitHub** | https://github.com/rotkf125-gif/nexus-dashboard |
| **Database** | Supabase (PostgreSQL) |

---

## ✅ 구현 완료 기능

### 🔐 인증 & 동기화
- [x] Supabase 연동 (클라우드 데이터 저장)
- [x] Google OAuth 로그인
- [x] 이메일/비밀번호 로그인
- [x] URL 파라미터 공유 (`?uid=xxx`)
- [x] 모바일 동기화 지원

### 📊 대시보드
- [x] 실시간 주가 조회 (Yahoo Finance)
- [x] 프리마켓/애프터마켓 가격 지원
- [x] 주요 지수 (NASDAQ, S&P500, VIX, US10Y, USD/KRW)
- [x] 평가금/원금/수익금 표시
- [x] Star Core 도넛 차트
- [x] Sidebar 차트 (Weight, Sector, Type, Rankings)

### 📈 자산 관리
- [x] 자산 추가/수정/삭제 모달
- [x] 드래그 앤 드롭 정렬
- [x] Compact 모드
- [x] Delta 지표 (가격 변동 표시)

### 💰 배당 관리
- [x] Income Stream 카드 (Total Return 계산)
- [x] Trade Return 입력
- [x] Recovery 진행률
- [x] Google Sheets 동기화
- [x] Dividend Analytics (DPS Trend + Learning 통합)

### ⚙️ 설정
- [x] 환율 수동 설정
- [x] API 갱신 주기 설정
- [x] 데이터 Export (JSON)
- [x] 데이터 Import (JSON)
- [x] 데이터 초기화

---

## 📁 프로젝트 구조

```
nexus-next/
├── app/
│   ├── page.tsx              # 메인 대시보드
│   ├── layout.tsx            # 루트 레이아웃
│   └── api/
│       ├── market/route.ts   # 지수 API (프리/애프터마켓)
│       └── price/[ticker]/route.ts
├── components/
│   ├── Header.tsx            # 헤더 (Auth, 지수)
│   ├── AuthModal.tsx         # 로그인/회원가입
│   ├── AssetTable.tsx        # 자산 테이블 (드래그)
│   ├── AssetModal.tsx        # 자산 추가/수정
│   ├── IncomeStream.tsx      # 배당 수익 카드
│   ├── DividendAnalytics.tsx # DPS + Learning 통합
│   ├── DividendModal.tsx     # 배당 기록
│   ├── SettingsModal.tsx     # 설정 (Export/Import)
│   ├── Sidebar.tsx           # 차트 사이드바
│   ├── StarCore.tsx          # 도넛 차트
│   ├── WhatIfSimulator.tsx   # What-If 시뮬레이터
│   └── StrategyBar.tsx       # 전략 메모
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트
│   ├── storage.ts            # 하이브리드 스토리지
│   ├── context.tsx           # 전역 상태 관리
│   ├── types.ts              # TypeScript 타입
│   └── config.ts             # 기본 설정
└── styles/
    └── globals.css           # Celestial Glass 테마
```

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
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  assets JSONB DEFAULT '[]'::jsonb,
  dividends JSONB DEFAULT '[]'::jsonb,
  trade_sums JSONB DEFAULT '{}'::jsonb,
  market JSONB DEFAULT '{}'::jsonb,
  exchange_rate NUMERIC DEFAULT 1450,
  strategy TEXT DEFAULT '',
  compact_mode BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all"
  ON portfolios FOR ALL
  USING (true) WITH CHECK (true);
```

### Google OAuth 설정
1. Supabase Dashboard → Authentication → Providers → Google
2. Google Cloud Console에서 OAuth 2.0 클라이언트 생성
3. Redirect URI: `https://xxx.supabase.co/auth/v1/callback`

---

## 🔧 API Routes

### GET /api/price/[ticker]
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

**marketState 값:**
- `REGULAR`: 정규장
- `PRE`: 프리마켓
- `POST`: 애프터마켓
- `CLOSED`: 장 마감

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
git commit -m "커밋 메시지"
git push

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

## 📄 라이선스

Private Project - Personal Use Only
