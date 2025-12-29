# 🌟 NEXUS CELESTIAL V64.2 - Next.js Edition

개인 투자 포트폴리오 대시보드의 Next.js 버전입니다.

## ✅ 해결된 문제

| 문제 | 기존 | Next.js |
|------|------|---------|
| CORS | 프록시 의존 (불안정) | API Routes로 해결 |
| 호스팅 | GitHub Pages (정적만) | Vercel (서버리스 포함) |
| 코드 구조 | 단일 HTML | 모듈화된 컴포넌트 |

---

## 📋 Mino가 해야 할 것

### 1단계: 개발 환경 설치

#### Node.js 설치 (필수)
1. https://nodejs.org 접속
2. **LTS 버전** (v20.x) 다운로드 & 설치
3. 터미널에서 확인:
   ```bash
   node -v   # v20.x.x 출력되면 성공
   npm -v    # 10.x.x 출력되면 성공
   ```

#### VS Code 설치 (권장)
1. https://code.visualstudio.com 접속
2. 다운로드 & 설치
3. 추천 확장 프로그램:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - ES7+ React snippets

---

### 2단계: 프로젝트 실행

```bash
# 1. 압축 해제 후 폴더로 이동
cd nexus-next

# 2. 패키지 설치 (최초 1회)
npm install

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속!

---

### 3단계: GitHub 저장소 생성

#### GitHub 계정 만들기
1. https://github.com 접속
2. Sign up → 계정 생성

#### 저장소 생성
1. GitHub 로그인
2. 우측 상단 **+** → **New repository**
3. Repository name: `nexus-dashboard`
4. **Public** 선택 (Vercel 무료 플랜용)
5. **Create repository** 클릭

#### 코드 업로드
```bash
# 터미널에서 프로젝트 폴더로 이동
cd nexus-next

# Git 초기화
git init
git add .
git commit -m "Initial commit - NEXUS V64.2"

# GitHub 연결 (YOUR_USERNAME을 본인 계정으로 변경!)
git remote add origin https://github.com/YOUR_USERNAME/nexus-dashboard.git
git branch -M main
git push -u origin main
```

---

### 4단계: Vercel 배포

#### Vercel 가입
1. https://vercel.com 접속
2. **Continue with GitHub** 클릭 (GitHub 계정으로 로그인)

#### 프로젝트 배포
1. Vercel 대시보드 → **Add New...** → **Project**
2. **Import Git Repository** → `nexus-dashboard` 선택
3. 설정은 기본값 유지 → **Deploy** 클릭
4. 2-3분 후 배포 완료!

#### 결과
- URL 예시: `https://nexus-dashboard-xxx.vercel.app`
- 이후 GitHub에 push하면 **자동 배포**!

---

## 📁 프로젝트 구조

```
nexus-next/
├── app/
│   ├── layout.tsx          # 공통 레이아웃
│   ├── page.tsx             # 메인 페이지
│   └── api/
│       ├── price/[ticker]/  # 주가 API (CORS 해결!)
│       │   └── route.ts
│       └── market/          # 시장 지수 API
│           └── route.ts
├── components/
│   ├── Header.tsx           # 헤더 컴포넌트
│   ├── AssetTable.tsx       # 자산 테이블
│   └── StarCore.tsx         # 중앙 차트
├── lib/
│   ├── types.ts             # TypeScript 타입
│   ├── config.ts            # 설정 상수
│   ├── storage.ts           # localStorage 관리
│   └── context.tsx          # React Context (상태 관리)
├── styles/
│   └── globals.css          # 전역 스타일
├── package.json
├── tailwind.config.js
└── next.config.js
```

---

## 🔧 API Routes 설명

### `/api/price/[ticker]`
```
GET /api/price/AAPL
→ { "ticker": "AAPL", "price": 178.52, ... }
```

### `/api/market`
```
GET /api/market
→ { "nasdaq": 15234.56, "sp500": 4892.34, "vix": 14.23, ... }
```

**서버에서 Yahoo Finance를 호출**하므로 CORS 문제 없음!

---

## 🚀 개발 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버
npm run lint     # 코드 검사
```

---

## 📝 커스터마이징

### 자산 추가/삭제
`lib/config.ts`의 `DEFAULT_ASSETS` 수정:
```typescript
export const DEFAULT_ASSETS: Asset[] = [
  { ticker: 'PLTY', qty: 100, avg: 27.00, ... },
  { ticker: 'HOOY', qty: 100, avg: 34.00, ... },
  // 여기에 추가
];
```

### 테마 색상 변경
`tailwind.config.js`의 `colors` 수정

### 새 컴포넌트 추가
`components/` 폴더에 파일 생성 후 `app/page.tsx`에서 import

---

## ⚠️ 현재 미구현 기능

Phase 1으로 핵심 기능만 구현되어 있습니다:

- [x] Header (총 자산, 시장 지수)
- [x] Asset Table (자산 목록)
- [x] Star Core (도넛 차트)
- [x] API Routes (CORS 해결)
- [ ] Asset 추가/수정 모달
- [ ] Dividend 입력/분석
- [ ] What-If 시뮬레이터
- [ ] DPS 트렌드 차트
- [ ] Freedom v30 연동
- [ ] 드래그 정렬

추가 구현이 필요하면 말씀해주세요!

---

## 🆘 문제 해결

### `npm install` 오류
```bash
# Node.js 버전 확인
node -v  # v18 이상 필요

# 캐시 정리 후 재시도
npm cache clean --force
npm install
```

### Vercel 배포 실패
1. Vercel 대시보드 → Deployments → 실패한 배포 클릭
2. Build Logs 확인
3. 대부분 TypeScript 타입 오류 → 해당 파일 수정

### 포트 충돌
```bash
# 다른 포트로 실행
npm run dev -- -p 3001
```

---

## 📞 연락

문제가 있으면 Claude에게 물어보세요! 🤖
