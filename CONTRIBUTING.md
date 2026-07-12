# Contributing to Refine

Refine 은 개인 북마크 매니저로 시작했지만 외부 컨트리뷰션을 환영합니다. 이 문서는 PR 을 보낼 때 따라야 할 최소 컨벤션입니다.

## 시작 전

1. 큰 작업이라면 먼저 [issue 에서 논의](https://github.com/kimmjen/refine/issues) — 오해와 헛수고 방지
2. 이미 비슷한 작업이 있는지 [열린 PR](https://github.com/kimmjen/refine/pulls) 확인

## 로컬 셋업

```bash
pnpm install
cp .env.example .env.local   # Supabase / Gemini 키 입력
pnpm dev
```

필요한 환경 변수:

| 변수 | 용도 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트용 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 — 절대 클라이언트 노출 금지 |
| `GEMINI_API_KEY` | Google Gemini API |

DB 스키마는 `supabase/migrations/` 의 SQL 을 번호 순서대로 적용하세요.

## 워크플로우

```
Issue → Branch → Conventional commit → PR → merge
```

- 모든 PR 은 `main` 을 base 로
- 브랜치 이름: `feat/<issue>-<desc>`, `fix/<issue>-<desc>`, `chore/<desc>`, `docs/<desc>`
- commit message: [Conventional Commits](https://www.conventionalcommits.org/) 권장 (`feat:`, `fix:`, `chore:`, `docs:`)
- PR title 에 관련 issue 번호 (`(#N)`) 포함

## 코드 컨벤션

다음은 실제로 PR 거절 사유가 되는 항목들 — 의식적으로 따라주세요.

### UI 컴포넌트
- **네이티브 `<button>` / `<input>` 직접 사용 금지** — shadcn/ui 컴포넌트 (`Button`, `Input`, `Card`, `Alert` 등) 사용
- `components/ui/` 는 shadcn CLI 로만 관리 — 수동 편집 금지

### 테마 토큰
- **하드코딩 색상 금지** (`bg-white`, `text-gray-500` 등) — Tailwind semantic 토큰만 (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`)
- 라이트 / 다크 모두에서 확인

### i18n
- 사용자에게 보이는 모든 문자열은 `public/locales/{en,ko}/common.json` 에 **두 로케일 모두** 추가
- 새 페이지는 `getStaticProps` / `getServerSideProps` 에 `serverSideTranslations(locale, ['common'], nextI18NextConfig)` 필수

### API 라우트
- 변경 계열 endpoint 는 `withAuth()` (관리자는 `withAdmin()`) + `applyRateLimit()` 필수
- 응답은 `apiError()` / `apiSuccess()` (`lib/api-response.ts`) 사용 — 임의 `res.json()` 금지
- URL 비교 / 저장은 `normalizeUrl()` / `ensureProtocol()` (`lib/url.ts`) 경유

### 테스트
- 새 기능에는 단위 테스트 동반 — vitest, `__tests__/` 에 flat file 로
- 새 PR 은 기존 테스트 모두 통과 필수

### Co-Authored-By 등 attribution 라인
- commit message 에 `Co-Authored-By`, `Generated with` 등 attribution 라인 일체 추가 금지

## PR 보내기

1. fork → 본인 브랜치
2. 위 컨벤션 따라 변경
3. **로컬에서 검증**:
   ```bash
   pnpm lint
   pnpm test
   ```
4. PR open — base = `main`, head = `<your-fork>:<branch>`
5. 메인테이너 리뷰 대기

## 보안 신고

보안 이슈는 GitHub Issue 가 아니라 [`SECURITY.md`](./SECURITY.md) 의 채널로.

## 라이선스

기여하시는 모든 코드는 [MIT 라이선스](./LICENSE) 로 배포됩니다.
