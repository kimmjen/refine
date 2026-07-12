# Project Structure

프로젝트의 전체 구조와 각 파일의 역할을 설명합니다.

---

## Root Directory

```
refine/
├── components/          # React 컴포넌트
├── contexts/            # React Context (전역 상태)
├── docs/                # 문서
├── lib/                 # 유틸리티 및 라이브러리
├── pages/               # Next.js 페이지 및 API
├── public/              # 정적 파일
├── styles/              # 스타일시트
├── supabase/            # Supabase 관련 파일
├── types/               # TypeScript 타입 정의
├── .gitignore           # Git 제외 파일
├── CHANGELOG.md         # 변경 로그
├── README.md            # 프로젝트 설명
├── eslint.config.mjs    # ESLint 설정
├── next.config.mjs      # Next.js 설정
├── package.json         # 의존성 관리
├── postcss.config.mjs   # PostCSS 설정
└── tsconfig.json        # TypeScript 설정
```

---

## /components

React 컴포넌트를 기능별로 분류합니다.

### /components/common

재사용 가능한 공통 UI 컴포넌트

| 파일 | 역할 |
|------|------|
| `BaseCard.tsx` | 카드 UI의 기본 컴포넌트. 그림자, 테두리, 패딩 등 공통 스타일 제공 |
| `ErrorBoundary.tsx` | React Error Boundary. 하위 컴포넌트 에러 시 fallback UI 표시 |
| `PlatformIcon.tsx` | 플랫폼별 아이콘 렌더링 (YouTube, GitHub, Instagram 등) |
| `PrimaryButton.tsx` | 기본 버튼 스타일 컴포넌트 |
| `RefineLogo.tsx` | 앱 로고 SVG 컴포넌트. 애니메이션 옵션 지원 |
| `SEO.tsx` | 페이지별 SEO 메타 태그 (title, description, og:image) |
| `Skeleton.tsx` | 로딩 상태 표시용 스켈레톤 UI |

### /components/layout

페이지 레이아웃 관련 컴포넌트

| 파일 | 역할 |
|------|------|
| `Header.tsx` | 앱 헤더. 로고, 네비게이션, 사용자 프로필 드롭다운 포함 |
| `LayoutShell.tsx` | 페이지 공통 레이아웃 래퍼. Header 포함, PWA 메타 태그 설정 |

### /components/modules

기능별 복잡한 컴포넌트

| 파일 | 역할 |
|------|------|
| `AddLinkModal.tsx` | 링크 추가/수정 모달. URL 입력, 중복 검사, 카테고리 선택 기능 |
| `LinkCard.tsx` | 링크 카드 UI. 썸네일, 제목, 플랫폼 뱃지, 읽음 상태 토글 포함 |

---

## /contexts

React Context를 사용한 전역 상태 관리

| 파일 | 역할 |
|------|------|
| `AuthContext.tsx` | 인증 상태 관리. user, session, isLoading 상태 및 signInWithGoogle, signOut 함수 제공 |

**AuthContext 제공 값:**

```typescript
interface AuthContextType {
  user: User | null;           // 현재 로그인된 사용자
  session: Session | null;     // 세션 정보 (access_token 포함)
  isLoading: boolean;          // 인증 상태 로딩 중
  signInWithGoogle: () => Promise<void>;  // Google OAuth 로그인
  signOut: () => Promise<void>;           // 로그아웃
}
```

---

## /lib

유틸리티 함수 및 외부 서비스 연동

### Root 파일

| 파일 | 역할 |
|------|------|
| `auth.ts` | API 라우트용 인증 헬퍼. `getAuthUser()`, `withAuth()` 함수 제공 |
| `constants.ts` | 앱 상수 정의. 카테고리 목록 등 |
| `supabase.ts` | Supabase 클라이언트 팩토리. 브라우저/서버 클라이언트 분리, 싱글톤 패턴 |
| `supabaseClient.ts` | (레거시) 기존 Supabase 클라이언트. 하위 호환용 |
| `url.ts` | URL 관련 유틸리티. 정규화, 변형 생성 |
| `utils.ts` | 범용 유틸리티. 클래스 병합, 날짜 포맷, 시간 포맷 |

### /lib/platforms

플랫폼별 유틸리티

| 파일 | 역할 |
|------|------|
| `index.ts` | 플랫폼 감지 로직. `detectPlatform()`, `isVideoPlatform()`, `isSocialPlatform()` |
| `youtube.ts` | YouTube 전용 유틸리티. 비디오 ID 추출, 임베드 URL 생성, 썸네일 URL 생성 |

### /lib/server

서버 전용 유틸리티 (Node.js 환경)

| 파일 | 역할 |
|------|------|
| `scraper.ts` | Open Graph 메타데이터 스크래핑. cheerio 사용하여 og:image, og:title, og:description 추출 |

---

## /lib 상세

### auth.ts

```typescript
// API 요청에서 인증된 사용자 추출
getAuthUser(req: NextApiRequest): Promise<User | null>

// 인증 필수 API 래퍼
withAuth(handler): (req, res, user) => Promise<void>
```

### constants.ts

```typescript
// 사용 가능한 카테고리 목록
CATEGORIES: string[] = [
  "IT / Tech", "AI / GPT", "Business", "Finance", 
  "News", "Design", "Marketing", "Bible / Faith",
  "Video", "Music", "Reading", "Study",
  "Health", "Travel", "Shopping", "Game",
  "Food", "Etc"
]
```

### url.ts

```typescript
// URL 정규화 (www 제거, 소문자 변환, trailing slash 제거)
normalizeUrl(url: string): string

// URL 변형 생성 (중복 검사용)
getUrlVariants(url: string): string[]
```

### utils.ts

```typescript
// Tailwind 클래스 병합
cn(...inputs: ClassValue[]): string

// 날짜 포맷 (2024. 05. 20.)
formatDate(dateString: string): string

// 시간 포맷 (3:05)
formatDuration(seconds: number): string
```

### platforms/index.ts

```typescript
type PlatformType = 
  | 'Youtube' | 'Instagram' | 'Threads' | 'X (Twitter)'
  | 'Facebook' | 'LinkedIn' | 'Naver' | 'Velog'
  | 'Medium' | 'GitHub' | 'Website'

// URL에서 플랫폼 감지
detectPlatform(url: string): PlatformType

// 비디오 플랫폼 여부
isVideoPlatform(platform: PlatformType): boolean

// 소셜 미디어 여부
isSocialPlatform(platform: PlatformType): boolean
```

### platforms/youtube.ts

```typescript
interface YoutubeInfo {
  videoId: string | null;
  listId: string | null;
  isShorts: boolean;
}

// YouTube URL 파싱
getYoutubeInfo(url: string): YoutubeInfo

// 임베드 URL 생성
getYoutubeEmbedUrl(videoId: string, listId?: string): string

// 썸네일 URL 생성
getYoutubeThumbnail(videoId: string, quality?: 'default' | 'mq' | 'hq' | 'maxres'): string
```

### server/scraper.ts

```typescript
// OG 이미지 추출
fetchOgImage(url: string): Promise<string | null>

// OG 타이틀 추출
fetchOgTitle(url: string): Promise<string | null>

// OG 설명 추출
fetchOgDescription(url: string): Promise<string | null>

// 모든 OG 메타데이터 추출
fetchOgMetadata(url: string): Promise<{ title, description, image }>
```

---

## /pages

Next.js Pages Router 기반 페이지 및 API

### 페이지

| 파일 | 경로 | 역할 | 인증 |
|------|------|------|------|
| `_app.tsx` | - | 앱 진입점. AuthProvider, ErrorBoundary 래핑 | - |
| `_document.tsx` | - | HTML 문서 커스터마이징. 폰트, 메타 태그 | - |
| `index.tsx` | `/` | 메인 대시보드. 링크 목록, 검색, 필터, 뷰 전환 | 필수 |
| `profile.tsx` | `/profile` | 사용자 프로필. 통계, 디버그 정보, 데이터 내보내기 | 필수 |
| `share.tsx` | `/share` | PWA 공유 타겟. 외부 앱에서 공유된 링크 수신 | 필수 |
| `auth/login.tsx` | `/auth/login` | 로그인 페이지. Google OAuth 버튼 | 불필요 |
| `auth/callback.tsx` | `/auth/callback` | OAuth 콜백 핸들러. 토큰 처리 후 리다이렉트 | 불필요 |
| `link/[id].tsx` | `/link/:id` | 링크 상세 페이지. YouTube 임베드, 메타데이터 표시 | 불필요 |

### /pages/api

서버리스 API 엔드포인트

| 파일 | 메서드 | 역할 | 인증 |
|------|--------|------|------|
| `save-shared-content.ts` | POST | 새 링크 저장. 플랫폼 감지, OG 이미지 스크래핑 | 필수 |
| `check-duplicate.ts` | POST | URL 중복 검사. 정규화된 URL 변형들 검색 | 필수 |
| `delete-link.ts` | DELETE | 링크 삭제 | 필수 |
| `toggle-read.ts` | PATCH | 읽음 상태 토글 | 필수 |
| `update-link.ts` | PATCH | 링크 정보 수정 (제목, 설명, 카테고리) | 필수 |
| `playlist.ts` | GET | YouTube 플레이리스트 정보 조회 (Invidious API) | 불필요 |
| `hello.js` | GET | 테스트용 API | 불필요 |

---

## /public

정적 파일 (CDN 서빙)

| 파일 | 역할 |
|------|------|
| `manifest.json` | PWA 매니페스트. 앱 이름, 아이콘, 테마 색상, share_target 설정 |
| `favicon.ico` | 파비콘 |
| `icon-192x192.png` | PWA 아이콘 (192x192) |
| `icon-512x512.png` | PWA 아이콘 (512x512) |
| `logo.svg` | 앱 로고 SVG |
| `icon.svg` | 앱 아이콘 SVG |

---

## /styles

CSS 스타일시트

| 파일 | 역할 |
|------|------|
| `globals.css` | 글로벌 스타일. Tailwind 지시문, CSS 변수, 기본 스타일 |

---

## /supabase

Supabase 관련 파일

### /supabase/migrations

데이터베이스 마이그레이션 SQL

| 파일 | 역할 |
|------|------|
| `001_add_user_id.sql` | user_id 컬럼 추가, 인덱스 생성, RLS 정책 설정 |

**마이그레이션 내용:**

```sql
-- user_id 컬럼 추가
ALTER TABLE shared_links ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 인덱스 생성
CREATE INDEX idx_shared_links_user_id ON shared_links(user_id);

-- RLS 활성화
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (사용자별 데이터 격리)
CREATE POLICY "Users can view own links" ON shared_links FOR SELECT...
CREATE POLICY "Users can insert own links" ON shared_links FOR INSERT...
CREATE POLICY "Users can update own links" ON shared_links FOR UPDATE...
CREATE POLICY "Users can delete own links" ON shared_links FOR DELETE...
```

---

## /types

TypeScript 타입 정의

| 파일 | 역할 |
|------|------|
| `db.ts` | 데이터베이스 모델 타입. SharedLink, User 인터페이스 |

**타입 정의:**

```typescript
interface SharedLink {
  id: number;
  created_at: string;
  url: string;
  title: string | null;
  description: string | null;
  platform: string | null;
  image_url: string | null;
  category: string | null;
  is_read: boolean;
  user_id: string | null;
}

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}
```

---

## /docs

프로젝트 문서

| 파일 | 역할 |
|------|------|
| `API.md` | API 엔드포인트 상세 문서 |
| `ARCHITECTURE.md` | 시스템 아키텍처 문서 |
| `PERFORMANCE_OPTIMIZATION.md` | 성능 최적화 가이드 |
| `TECHNICAL_IMPROVEMENTS.md` | 기술적 개선 사항 |
| `PROJECT_STRUCTURE.md` | 프로젝트 구조 문서 (이 파일) |

---

## Configuration Files

### next.config.mjs

```javascript
// PWA 설정
withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})

// 이미지 최적화
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    { hostname: 'img.youtube.com' },
    { hostname: 'i.ytimg.com' },
    { hostname: '**.supabase.co' },
    { hostname: '**.googleusercontent.com' },
  ]
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]  // 절대 경로 임포트
    }
  }
}
```

### .gitignore 주요 항목

```
.env*              # 환경 변수 파일
scripts/           # 스크립트 (DB 자격증명 포함)
/.next/            # 빌드 출력
/node_modules/     # 의존성
public/sw.js       # PWA 서비스 워커 (빌드 생성)
```

---

## Data Flow

### 링크 저장 흐름

```
1. 사용자가 URL 입력 (AddLinkModal)
2. 중복 검사 API 호출 (/api/check-duplicate)
3. URL 정규화 및 변형 생성 (lib/url.ts)
4. 데이터베이스 검색 (user_id 필터)
5. 중복 없으면 저장 API 호출 (/api/save-shared-content)
6. 플랫폼 감지 (lib/platforms)
7. OG 메타데이터 스크래핑 (lib/server/scraper.ts)
8. 데이터베이스 저장 (user_id 포함)
```

### 인증 흐름

```
1. 로그인 버튼 클릭 (/auth/login)
2. Supabase OAuth 호출 (Google)
3. Google 인증
4. 콜백 처리 (/auth/callback)
5. 세션 저장 (localStorage via Supabase SDK)
6. AuthContext 상태 업데이트
7. 보호된 페이지 접근 가능
```

---

## Dependencies

### Production

| 패키지 | 용도 |
|--------|------|
| `next` | React 프레임워크 |
| `react` | UI 라이브러리 |
| `@supabase/supabase-js` | Supabase 클라이언트 |
| `framer-motion` | 애니메이션 |
| `tailwindcss` | CSS 프레임워크 |
| `lucide-react` | 아이콘 |
| `cheerio` | HTML 파싱 (스크래핑) |
| `dayjs` | 날짜 처리 |
| `@ducanh2912/next-pwa` | PWA 지원 |

### Development

| 패키지 | 용도 |
|--------|------|
| `typescript` | 타입 체크 |
| `eslint` | 코드 린팅 |
| `tailwind-merge` | Tailwind 클래스 병합 |
| `clsx` | 조건부 클래스 |
