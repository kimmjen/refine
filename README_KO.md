# Refine - AI 기반 링크 수집기

> **지식을 큐레이션하세요** -- AI로 링크를 수집, 분류, 요약하는 PWA 앱

[English](./README.md) | **한국어**

**[Live Demo](https://refine-rust.vercel.app/)**

모바일 공유 시트에서 링크를 저장하고, AI가 자동으로 카테고리를 분류하고, 요약과 태그를 생성하는 개인 북마크 매니저입니다.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?logo=supabase)](https://supabase.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0--flash-orange?logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 주요 기능

### 핵심
- **PWA 공유 타겟** -- 모바일 공유 시트에서 바로 링크 저장
- **링크 CRUD** -- 생성, 조회, 수정, 삭제
- **중복 감지** -- 스마트 URL 정규화 및 중복 검사
- **읽음/안읽음** -- 인박스/아카이브 관리
- **그리드/리스트 뷰** -- 카드 그리드와 컴팩트 리스트 전환

### AI (Gemini)
- **자동 카테고리 분류** -- 저장 시 AI가 23개+ 카테고리 중 자동 분류
- **AI 요약** -- 한 줄 요약 생성 (한국어/영어 지원)
- **AI 태그 추출** -- 링크당 최대 5개 키워드 추출
- **일괄 AI 보강** -- 기존 링크에 카테고리 + 요약 + 태그 일괄 적용
- **개별 보강** -- 상세 페이지에서 수동 AI 보강
- **사용자별 AI 설정** -- 제공자 선택, 자동 기능 토글, 출력 언어 설정

### 카테고리 관리
- **커스텀 카테고리** -- 추가, 삭제, 순서 변경
- **드래그 앤 드롭 정렬** -- 시각적 순서 변경 및 저장
- **링크 수 표시** -- 카테고리별 통계
- **기본 카테고리** -- 신규 사용자 자동 초기화 (23개)

### 검색 및 필터
- **서버사이드 검색** -- 제목, URL, 설명으로 디바운스 검색
- **카테고리 필터링** -- 카테고리별 필터
- **읽음 상태 필터** -- 전체 / 안읽음 / 읽음
- **정렬 옵션** -- 최신순, 오래된순, 제목(A-Z/Z-A), 플랫폼, 카테고리

### 미디어 통합
- **YouTube 플레이어** -- 영상, Shorts 임베디드 재생
- **재생목록 지원** -- 자동 로드 및 탐색
- **이미지 캐러셀** -- 인스타그램 등 다중 이미지 표시
- **OG 이미지** -- 자동 썸네일 스크래핑

### 플랫폼 감지 및 스크래핑
- **100+ 플랫폼 인식** -- YouTube, Notion, Figma, Discord, Spotify, Stack Overflow 등
- **자동 도메인 폴백** -- 미인식 사이트는 도메인에서 이름 자동 추출
- **스마트 User-Agent** -- 플랫폼별 최적 UA로 안정적 스크래핑
- **사용자명 추출** -- 7개 플랫폼 URL 파싱
- **플랫폼 메타데이터** -- GitHub 스타/포크, Twitter oEmbed, YouTube 썸네일

### 다국어 (i18n)
- **영어 / 한국어** -- 240개 번역 키로 완전한 양언어 지원
- **로캘 전환** -- 헤더 드롭다운 + 설정 페이지에서 언어 변경
- **AI 출력 언어** -- 사용자별 AI 요약/태그 출력 언어 설정

### 인증 및 보안
- **Google OAuth** -- Supabase Auth를 통한 원클릭 로그인
- **다중 사용자** -- Row Level Security로 사용자별 데이터 격리
- **API 보호** -- 모든 mutable 엔드포인트 인증 필수
- **레이트리밋** -- 사용자당 10 req/min (모든 쓰기 엔드포인트)
- **보안 헤더** -- X-Frame-Options, X-Content-Type-Options, Referrer-Policy 등
- **입력 검증** -- update-link 필드 화이트리스트, admin/db sortBy 검증

### 관리자 대시보드
- **접근** -- `admin_users` 테이블로 관리자 지정 후 (아래 [관리자 계정 설정](#관리자-계정-설정-선택) 참고) `/admin` 접속. 로그인 페이지에 숨겨진 이메일/비밀번호 관리자 폼도 있음 (`Ctrl + Shift + Q`)
- **시스템 통계** -- 전체 사용자, 링크 수, 최근 활동
- **사용자 관리** -- 사용자 목록, 권한 토글, 삭제, 상세 확인
- **데이터베이스 도구** -- 실시간 스키마 조회 및 SQL 콘솔
- **에러 로그** -- 레벨/소스별 필터링, 스택트레이스 확인

### 에러 모니터링
- **Supabase 기반** -- `error_logs` 테이블에 에러 저장 (상용화 시 Sentry로 교체 가능)
- **클라이언트 에러 캡처** -- React ErrorBoundary가 `/api/error-log`로 에러 전송
- **API 에러 로깅** -- `apiError()` 유틸로 서버 에러 자동 기록
- **Admin 에러 탭** -- 관리자 대시보드에서 에러 로그 조회, 필터, 삭제

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (Pages Router) |
| **언어** | TypeScript |
| **UI** | React 19 + shadcn/ui |
| **스타일링** | Tailwind CSS 4 |
| **애니메이션** | Framer Motion |
| **데이터베이스** | Supabase (PostgreSQL) |
| **인증** | Supabase Auth (Google OAuth) |
| **AI** | Google Gemini 2.0 Flash |
| **PWA** | @ducanh2912/next-pwa |
| **다국어** | next-i18next (en, ko) |
| **아이콘** | Lucide React |
| **스크래핑** | Cheerio |
| **데이터 페칭** | SWR |
| **테스트** | Vitest (82 tests) |

---

## 시작하기

### 사전 요구사항
- Node.js 18+
- pnpm 10+
- Supabase 프로젝트
- Google Gemini API 키

### 환경 변수

[`.env.example`](./.env.example) 을 `.env.local` 로 복사한 뒤 키를 채워주세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 설치 및 실행

```bash
git clone https://github.com/kimmjen/refine.git
cd refine
pnpm install
cp .env.example .env.local   # 키 입력
pnpm dev
```

[http://localhost:3000](http://localhost:3000) 접속

### 데이터베이스 설정

Supabase SQL 에디터에서 마이그레이션 순서대로 실행:

```
supabase/migrations/001_add_user_id.sql
supabase/migrations/002_add_dispatch_tracking.sql
supabase/migrations/003_user_settings.sql
supabase/migrations/004_ai_settings.sql
supabase/migrations/005_admin_functions.sql
supabase/migrations/006_admin_users_table.sql
supabase/migrations/007_error_logs.sql
supabase/migrations/008_performance_indexes.sql
supabase/migrations/009_rls_metadata_images.sql
```

### 관리자 계정 설정 (선택)

관리자 권한은 `admin_users` 테이블로 관리됩니다. 새 인스턴스에서 최초 관리자를 지정하려면:

1. 앱에서 Google 로그인 1회 (`auth.users` 에 계정 생성됨)
2. Supabase SQL Editor 에서 실행:

```sql
INSERT INTO admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'you@example.com';
```

3. `/admin` 접속 -- 관리자 대시보드 사용 가능

이후 추가 관리자는 Admin > 유저 관리에서 지정하거나 같은 SQL로 추가할 수 있습니다.

### 테스트

```bash
pnpm test        # 전체 테스트 실행 (82개)
pnpm test:watch  # 워치 모드
```

---

## PWA 설치

### Android
1. Chrome에서 사이트 열기
2. 주소창의 "설치" 클릭
3. 홈 화면에 추가 -- 공유 시트에서 "Refine" 선택 가능

### iOS
1. Safari에서 사이트 열기
2. 공유 버튼 -> "홈 화면에 추가"
3. iOS는 Share Target API 미지원
4. **대안:** 앱 내 "링크 추가" 버튼에서 클립보드 붙여넣기 사용

---

## 보안

| 기능 | 구현 |
|------|------|
| 인증 | Supabase Auth를 통한 Google OAuth |
| 인가 | 모든 API 라우트에 `withAuth()` / `withAdmin()` 래퍼 |
| Row Level Security | 모든 테이블에 user_id 기반 RLS 정책 |
| 레이트리밋 | 모든 mutable 엔드포인트에 사용자당 10 req/min |
| 보안 헤더 | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy |
| 입력 검증 | update-link 필드 화이트리스트, admin/db sortBy 화이트리스트, 검색어 길이 제한 |
| Fetch 타임아웃 | 스크래핑/외부 API 5초, Gemini AI 10초 |

---

## 기여하기

컨트리뷰션을 환영합니다! 워크플로우와 코드 컨벤션은 [CONTRIBUTING.md](./CONTRIBUTING.md) 를 참고하세요.

- 버그 / 기능 제안 -> [GitHub Issues](https://github.com/kimmjen/refine/issues)
- 보안 취약점 -> [SECURITY.md](./SECURITY.md) (public issue 로 올리지 마세요)
- 행동 규범 -> [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

---

## 라이선스

[MIT License](./LICENSE)
