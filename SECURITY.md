# Security Policy

## 신고 채널

보안 이슈는 **public GitHub Issue 로 등록하지 마세요.** 대신:

- [GitHub Security Advisory](https://github.com/kimmjen/refine/security/advisories/new) 로 비공개 신고
- 또는 메인테이너에게 직접 연락

신고 후 영업일 기준 7일 내 1차 응답을 목표로 합니다.

## 보안 모델

Refine 은 **멀티유저 웹 앱**입니다. 셀프호스팅 시 아래 모델을 그대로 유지해야 합니다:

- 인증: Google OAuth via Supabase Auth — API 라우트는 Bearer 토큰을 `withAuth()` 로 검증
- 데이터 격리: 모든 테이블에 `user_id` 기준 Row Level Security (RLS)
- 두 개의 Supabase 클라이언트:
  - 브라우저: anon key, RLS 적용
  - 서버: Service Role Key, RLS 우회 — **API 라우트에서만 사용, 클라이언트 번들 미포함**
- 모든 변경 계열 endpoint: 인증 + rate limit (10 req/min)
- 입력 검증: `update-link` 필드 화이트리스트, admin 쿼리 sortBy 검증
- 보안 헤더: `next.config.mjs` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy 등)

## 비밀 관리

- 모든 비밀 (`SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) 은 `.env.local` 에만 — repo 에 커밋 금지
- `NEXT_PUBLIC_` prefix 는 클라이언트 번들에 포함됨 — anon key 외 사용 금지

## 지원 범위

- `main` 브랜치 = 활성 개발 라인 — 보안 fix 항상 우선
- 태그된 릴리즈 없음 (현 시점) — 보안 fix 는 `main` 머지 시점이 릴리즈
