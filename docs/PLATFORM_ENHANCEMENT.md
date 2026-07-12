# Platform Enhancement Plan

Issue: #6 플랫폼별 개선

---

## 개요

링크 저장 시 플랫폼별 추가 데이터를 수집하여 DB에 저장하고, 상세 페이지에서 풍부한 정보를 표시합니다.

### 핵심 원칙

1. **저장 시점에 데이터 수집** - 링크 공유 시 API 호출하여 메타데이터 획득
2. **DB에 영구 저장** - 매번 API 호출하지 않고 저장된 데이터 사용
3. **이미지 보관** - Supabase Storage에 이미지 저장 (원본 삭제 대비)
4. **스냅샷 방식** - 저장 시점 기준 데이터, 실시간 동기화 아님

---

## 대상 플랫폼

### 🌍 글로벌 우선 (Phase 1-3)

| 플랫폼 | 수집 데이터 | API | 우선순위 |
|--------|-------------|-----|----------|
| GitHub | 스타, 포크, 언어, 설명, 토픽 | GitHub REST API | P1 |
| Twitter/X | 트윗 내용, 좋아요, 리트윗, 작성자 | Twitter oEmbed | P1 |
| YouTube | 제목, 조회수, 좋아요, 채널, 썸네일 | YouTube Data API | P1 |
| 뉴스 기사 | 본문 텍스트, 읽기 시간 | Readability.js | P1 |
| Instagram | 캡션, 작성자, 미디어 | Instagram oEmbed | P2 |
| Reddit | 제목, 업보트, 댓글 수, 서브레딧 | Reddit API | P2 |
| TikTok | 영상 제목, 좋아요, 작성자 | TikTok oEmbed | P2 |
| LinkedIn | 포스트 내용, 작성자 프로필 | oEmbed (제한적) | P2 |
| Medium | 기사 제목, 클랩 수, 읽기 시간 | 스크래핑/RSS | P2 |
| Pinterest | 핀 이미지, 설명, 보드 | Pinterest API | P3 |
| Threads | 포스트 내용, 이미지, 작성자 | Meta API | P3 |

### 🇰🇷 한국 로컬 (Phase 4)

| 플랫폼 | 수집 데이터 | API | 비고 |
|--------|-------------|-----|------|
| Naver Blog | 포스트 제목, 요약, 썸네일 | Naver Open API | 한국 1위 블로그 |
| Velog | 블로그 제목, 요약, 썸네일 | GraphQL/스크래핑 | 개발자 블로그 |
| Tistory | 포스트 제목, 요약, 썸네일 | Tistory API | 한국 2위 블로그 |
| Brunch | 매거진/글 제목, 요약 | 스크래핑 | 카카오 플랫폼 |

---

## 데이터베이스 설계

### 테이블 구조

```
shared_links (기존)
    │
    ├── link_metadata (1:1) - 플랫폼별 메타데이터
    │
    └── link_images (1:N) - 저장된 이미지
```

### link_metadata 테이블

플랫폼별 추가 정보 저장

```sql
CREATE TABLE link_metadata (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT REFERENCES shared_links(id) ON DELETE CASCADE UNIQUE,
  
  -- GitHub
  github_stars INT,
  github_forks INT,
  github_language TEXT,
  github_topics TEXT[],
  github_description TEXT,
  github_owner_avatar TEXT,
  
  -- Twitter/X
  twitter_text TEXT,
  twitter_likes INT,
  twitter_retweets INT,
  twitter_author TEXT,
  twitter_author_avatar TEXT,
  twitter_media_urls TEXT[],
  
  -- YouTube
  youtube_title TEXT,
  youtube_channel TEXT,
  youtube_channel_avatar TEXT,
  youtube_views BIGINT,
  youtube_likes INT,
  youtube_duration TEXT,         -- ISO 8601 형식 (PT4M13S)
  youtube_thumbnail TEXT,
  youtube_published_at TIMESTAMPTZ,
  
  -- Instagram
  instagram_caption TEXT,
  instagram_author TEXT,
  instagram_likes INT,
  
  -- Reddit
  reddit_title TEXT,
  reddit_subreddit TEXT,
  reddit_upvotes INT,
  reddit_comments INT,
  reddit_author TEXT,
  reddit_body TEXT,              -- self post 내용
  
  -- Medium
  medium_title TEXT,
  medium_author TEXT,
  medium_claps INT,
  medium_reading_time INT,
  medium_tags TEXT[],
  
  -- TikTok
  tiktok_description TEXT,
  tiktok_author TEXT,
  tiktok_likes INT,
  tiktok_comments INT,
  tiktok_shares INT,
  
  -- LinkedIn
  linkedin_text TEXT,
  linkedin_author TEXT,
  linkedin_author_title TEXT,
  linkedin_likes INT,
  linkedin_comments INT,
  
  -- Threads
  threads_text TEXT,
  threads_author TEXT,
  threads_likes INT,
  threads_replies INT,
  
  -- Pinterest
  pinterest_description TEXT,
  pinterest_board TEXT,
  pinterest_saves INT,
  
  -- Naver Blog
  naver_title TEXT,
  naver_blogger TEXT,
  naver_summary TEXT,
  
  -- Velog
  velog_title TEXT,
  velog_author TEXT,
  velog_summary TEXT,
  velog_tags TEXT[],
  velog_likes INT,
  
  -- Tistory
  tistory_title TEXT,
  tistory_blog TEXT,
  tistory_summary TEXT,
  
  -- Brunch
  brunch_title TEXT,
  brunch_author TEXT,
  brunch_magazine TEXT,
  brunch_summary TEXT,
  
  -- 뉴스/기사 (Reader Mode)
  article_content TEXT,
  article_reading_time INT,      -- 분 단위
  article_author TEXT,
  article_published_at TIMESTAMPTZ,
  
  -- 공통
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);
```

### link_images 테이블

이미지 영구 저장

```sql
CREATE TABLE link_images (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT REFERENCES shared_links(id) ON DELETE CASCADE,
  
  image_type TEXT NOT NULL,  -- 'og', 'thumbnail', 'avatar', 'content'
  original_url TEXT,         -- 원본 URL (참고용)
  storage_path TEXT NOT NULL, -- Supabase Storage 경로
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS 정책

```sql
-- link_metadata
CREATE POLICY "Users can manage own link metadata" ON link_metadata
  FOR ALL USING (
    link_id IN (SELECT id FROM shared_links WHERE user_id = auth.uid())
  );

-- link_images  
CREATE POLICY "Users can manage own link images" ON link_images
  FOR ALL USING (
    link_id IN (SELECT id FROM shared_links WHERE user_id = auth.uid())
  );
```

---

## Storage 구조

Supabase Storage 버킷: `link-images`

```
link-images/
└── {user_id}/
    └── {link_id}/
        ├── og.jpg           # OG 이미지
        ├── thumbnail.jpg    # 썸네일
        ├── avatar.jpg       # 작성자 프로필
        └── content_1.jpg    # 본문 이미지 (여러 개 가능)
```

---

## 플랫폼별 구현 상세

### 1. GitHub

**수집 데이터:**
- 저장소 이름 (owner/repo)
- 설명 (description)
- 스타 수 (stargazers_count)
- 포크 수 (forks_count)
- 주요 언어 (language)
- 토픽 (topics)
- 소유자 아바타 (owner.avatar_url)
- 라이선스 (license.name)

**API:**
```
GET https://api.github.com/repos/{owner}/{repo}
```

**Rate Limit:** 비인증 60회/시간, 인증 5000회/시간

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [Avatar] owner/repo                 │
│ 설명 텍스트...                       │
│                                     │
│ ★ 1.2k  ⑂ 234  ● TypeScript        │
│ [react] [nextjs] [typescript]       │
└─────────────────────────────────────┘
```

### 2. Twitter/X

**수집 데이터:**
- 트윗 텍스트
- 작성자 username
- 작성자 프로필 이미지
- 좋아요 수
- 리트윗 수
- 첨부 미디어 URL

**API:**
```
GET https://publish.twitter.com/oembed?url={tweet_url}
```

**제한 사항:**
- oEmbed는 HTML만 반환
- 상세 데이터는 Twitter API v2 필요 (유료)

**대안:**
- Nitter (오픈소스 프록시) 스크래핑
- 또는 oEmbed HTML만 저장하여 임베드 표시

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [Avatar] @username                  │
│                                     │
│ 트윗 내용 텍스트...                  │
│                                     │
│ [이미지/동영상 썸네일]                │
│                                     │
│ ♡ 100  ↻ 50  💬 25                 │
└─────────────────────────────────────┘
```

### 3. Instagram

**수집 데이터:**
- 캡션
- 작성자 username
- 미디어 URL

**API:**
```
GET https://api.instagram.com/oembed?url={post_url}
```

**제한 사항:**
- 비로그인 oEmbed는 제한적
- 상세 데이터는 Instagram Graph API 필요

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [Avatar] @username                  │
│                                     │
│ [이미지/캐러셀]                      │
│                                     │
│ 캡션 텍스트...                       │
└─────────────────────────────────────┘
```

### 4. YouTube

**수집 데이터:**
- 영상 제목
- 채널명, 채널 아이콘
- 조회수, 좋아요 수
- 썸네일 (고화질)
- 영상 길이
- 업로드 날짜

**API:**
```
GET https://www.googleapis.com/youtube/v3/videos?id={video_id}&part=snippet,statistics
```

**Rate Limit:** 10,000 쿼터/일 (무료)

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [썸네일 + 재생시간]                  │
│                                     │
│ 영상 제목                            │
│ [채널아이콘] 채널명                   │
│                                     │
│ 👁 1.2M views  👍 50K  📅 2일 전     │
└─────────────────────────────────────┘
```

### 5. 뉴스 기사 (Reader Mode)

**수집 데이터:**
- 본문 텍스트 (HTML 정제)
- 예상 읽기 시간
- 작성자
- 발행일

**라이브러리:**
- @mozilla/readability
- cheerio

**처리 과정:**
1. HTML 페이지 fetch
2. Readability로 본문 추출
3. 단어 수 기반 읽기 시간 계산
4. 정제된 텍스트 저장

**UI 표시:**
```
┌─────────────────────────────────────┐
│ 기사 제목                            │
│ 출처: example.com | 3분 읽기         │
│─────────────────────────────────────│
│                                     │
│ 정제된 본문 텍스트...                 │
│ (광고, 메뉴 제거된 순수 콘텐츠)        │
│                                     │
│ [원본 보기] 버튼                     │
└─────────────────────────────────────┘
```

### 6. Reddit

**수집 데이터:**
- 포스트 제목
- 본문 (self post인 경우)
- 서브레딧 이름
- 업보트 수, 댓글 수
- 작성자
- 미디어 (이미지/동영상)

**API:**
```
GET https://www.reddit.com/{subreddit}/comments/{post_id}.json
```

**Rate Limit:** 60 요청/분

**UI 표시:**
```
┌─────────────────────────────────────┐
│ r/programming                       │
│                                     │
│ 포스트 제목                          │
│ Posted by u/username                │
│                                     │
│ ⬆ 1.5K  💬 234 comments             │
└─────────────────────────────────────┘
```

### 7. Medium

**수집 데이터:**
- 기사 제목
- 작성자, 프로필 이미지
- 클랩 수
- 예상 읽기 시간
- 태그

**API:** 공식 API 없음 - RSS 또는 스크래핑

```
GET https://medium.com/feed/@{username}
```

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [썸네일]                             │
│                                     │
│ 기사 제목                            │
│ [아바타] Author · 5 min read        │
│                                     │
│ 👏 1.2K  [JavaScript] [React]       │
└─────────────────────────────────────┘
```

### 8. LinkedIn

**수집 데이터:**
- 포스트 내용
- 작성자 이름, 직함
- 좋아요, 댓글 수

**API:** oEmbed (제한적), 공식 API는 승인 필요

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [아바타] 작성자 이름                  │
│ 직함 @ 회사                          │
│                                     │
│ 포스트 내용...                       │
│                                     │
│ 👍 234  💬 56 comments              │
└─────────────────────────────────────┘
```

### 9. TikTok

**수집 데이터:**
- 영상 설명
- 작성자
- 좋아요, 댓글, 공유 수
- 썸네일

**API:**
```
GET https://www.tiktok.com/oembed?url={video_url}
```

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [썸네일]                             │
│                                     │
│ @username                           │
│ 영상 설명...                         │
│                                     │
│ ❤ 50K  💬 1.2K  ↗ 500              │
└─────────────────────────────────────┘
```

### 10. Threads (Meta)

**수집 데이터:**
- 포스트 내용
- 작성자
- 좋아요, 답글 수
- 미디어

**API:** Meta Graph API (Instagram 연동)

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [아바타] @username                   │
│                                     │
│ 포스트 내용...                       │
│                                     │
│ [이미지]                             │
│                                     │
│ ❤ 1.2K  💬 234                      │
└─────────────────────────────────────┘
```

---

## 🇰🇷 한국 로컬 플랫폼 상세

### Naver Blog

**수집 데이터:**
- 포스트 제목
- 요약/발췌
- 대표 이미지
- 블로거 닉네임
- 작성일

**API:**
```
GET https://openapi.naver.com/v1/search/blog?query={keyword}
```

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [썸네일]                             │
│                                     │
│ 포스트 제목                          │
│ 블로거닉네임 · 2024.01.15            │
│                                     │
│ 요약 텍스트...                       │
└─────────────────────────────────────┘
```

### Velog

**수집 데이터:**
- 포스트 제목
- 요약
- 썸네일
- 태그
- 작성자
- 좋아요 수

**API:** GraphQL 엔드포인트

```graphql
query {
  post(username: "...", url_slug: "...") {
    title
    short_description
    thumbnail
    tags
    likes
  }
}
```

**UI 표시:**
```
┌─────────────────────────────────────┐
│ [썸네일]                             │
│                                     │
│ 포스트 제목                          │
│ @username                           │
│                                     │
│ 요약 텍스트...                       │
│ [JavaScript] [React]  ❤ 234        │
└─────────────────────────────────────┘
```

### Tistory

**수집 데이터:**
- 포스트 제목
- 요약
- 대표 이미지
- 블로그명
- 작성일

**API:** Tistory Open API (OAuth 필요)

### Brunch

**수집 데이터:**
- 글 제목
- 매거진명
- 작성자
- 요약

**API:** 공식 API 없음 - OG 태그 + 스크래핑

---

## 구현 순서

### Phase 1: 인프라 + 코어 글로벌 플랫폼

**인프라 (30분)**
1. DB 마이그레이션 실행
2. Supabase Storage 버킷 생성
3. TypeScript 타입 정의

**GitHub (1시간)**
1. GitHub API 호출 함수
2. save-shared-content.ts 수정
3. 상세 페이지 GitHub 카드

**Twitter/X (1시간)**
1. Twitter oEmbed 호출
2. 저장 로직 추가
3. 상세 페이지 트윗 임베드

**YouTube (1시간)**
1. YouTube Data API 연동
2. 영상 메타데이터 저장
3. 상세 페이지 YouTube 카드

### Phase 2: 글로벌 소셜 플랫폼

**뉴스 기사 Reader Mode (1시간)**
1. Readability 설치
2. 본문 추출 로직
3. Reader Mode UI

**Reddit (1시간)**
1. Reddit JSON API 호출
2. 저장 로직 추가
3. Reddit 포스트 카드

**Instagram (1시간)**
1. oEmbed 호출
2. 저장 및 표시

### Phase 3: 확장 글로벌 플랫폼

**Medium (1시간)**
1. RSS 파싱 또는 스크래핑
2. 저장 로직
3. Medium 카드

**TikTok (30분)**
1. oEmbed 연동
2. TikTok 카드

**LinkedIn (30분)**
1. oEmbed 연동 (제한적)
2. LinkedIn 카드

**Threads (30분)**
1. Meta API 연동
2. Threads 카드

**Pinterest (30분)**
1. Pinterest oEmbed
2. Pinterest 카드

### Phase 4: 한국 로컬 플랫폼

**Naver Blog (1시간)**
1. Naver Open API 연동
2. 저장 로직
3. Naver 블로그 카드

**Velog (1시간)**
1. GraphQL 쿼리
2. 저장 로직
3. Velog 카드

**Tistory (30분)**
1. Tistory API 연동
2. Tistory 카드

**Brunch (30분)**
1. 스크래핑 로직
2. Brunch 카드

---

## 파일 변경 목록

### 신규 생성

```
supabase/migrations/002_platform_data.sql

# 서버 유틸리티
lib/server/storage.ts
lib/server/readability.ts

# 플랫폼별 API
lib/platforms/youtube.ts
lib/platforms/reddit.ts
lib/platforms/medium.ts
lib/platforms/tiktok.ts
lib/platforms/linkedin.ts
lib/platforms/threads.ts
lib/platforms/pinterest.ts
lib/platforms/naver.ts
lib/platforms/velog.ts
lib/platforms/tistory.ts
lib/platforms/brunch.ts

# UI 컴포넌트 (플랫폼별 카드)
components/modules/platforms/GitHubCard.tsx
components/modules/platforms/TweetEmbed.tsx
components/modules/platforms/YouTubeCard.tsx
components/modules/platforms/RedditCard.tsx
components/modules/platforms/MediumCard.tsx
components/modules/platforms/TikTokCard.tsx
components/modules/platforms/LinkedInCard.tsx
components/modules/platforms/ThreadsCard.tsx
components/modules/platforms/InstagramCard.tsx
components/modules/platforms/PinterestCard.tsx
components/modules/platforms/NaverBlogCard.tsx
components/modules/platforms/VelogCard.tsx
components/modules/platforms/ReaderMode.tsx

# 플랫폼 카드 통합
components/modules/platforms/index.ts
components/modules/PlatformCard.tsx
```

### 수정

```
types/db.ts                      - 플랫폼 메타데이터 타입 추가
lib/platforms/github.ts          - API 함수 확장
lib/platforms/twitter.ts         - API 함수 확장
lib/platforms/index.ts           - 플랫폼 레지스트리 업데이트
pages/api/save-shared-content.ts - 플랫폼별 저장 로직
pages/link/[id].tsx              - 플랫폼별 렌더링
```

---

## 고려 사항

### API Rate Limit

| 플랫폼 | 제한 | 대응 |
|--------|------|------|
| GitHub | 60/시간 (비인증), 5000/시간 (인증) | Personal Access Token |
| Twitter | oEmbed 무제한 | - |
| YouTube | 10,000 쿼터/일 | API Key 필요 |
| Instagram | oEmbed 제한적 | 스크래핑 대안 |
| Reddit | 60 요청/분 | User-Agent 필수 |
| TikTok | oEmbed 무제한 | - |
| LinkedIn | oEmbed 제한적 | 공식 API 승인 필요 |
| Medium | RSS 무제한 | - |
| Naver | 25,000/일 | Client ID/Secret |
| Velog | 제한 없음 (비공식) | GraphQL |

### 저장 공간

| 항목 | 예상 크기 |
|------|-----------|
| 메타데이터 (1000링크) | ~10MB |
| 이미지 (1000링크, 평균 100KB) | ~100MB |

Supabase 무료 티어: 1GB Storage

### 에러 처리

- API 호출 실패 시: 기본 OG 데이터만 저장 (fallback)
- 이미지 다운로드 실패 시: original_url만 저장

---

## 예상 일정

| Phase | 작업 | 시간 |
|-------|------|------|
| **Phase 1** | 인프라 + 코어 글로벌 | **3.5시간** |
| | - 인프라 | 30분 |
| | - GitHub | 1시간 |
| | - Twitter/X | 1시간 |
| | - YouTube | 1시간 |
| **Phase 2** | 글로벌 소셜 | **3시간** |
| | - 뉴스 Reader Mode | 1시간 |
| | - Reddit | 1시간 |
| | - Instagram | 1시간 |
| **Phase 3** | 확장 글로벌 | **3시간** |
| | - Medium | 1시간 |
| | - TikTok | 30분 |
| | - LinkedIn | 30분 |
| | - Threads | 30분 |
| | - Pinterest | 30분 |
| **Phase 4** | 한국 로컬 | **3시간** |
| | - Naver Blog | 1시간 |
| | - Velog | 1시간 |
| | - Tistory | 30분 |
| | - Brunch | 30분 |
| **합계** | | **12.5시간** |

---

## 글로벌 타겟 전략

### 시장별 플랫폼 중요도

| 지역 | 주요 플랫폼 |
|------|-------------|
| **북미/유럽** | Twitter, Reddit, YouTube, Medium, LinkedIn, Pinterest |
| **아시아** | Twitter, Instagram, TikTok, YouTube, Threads |
| **한국** | Naver Blog, Velog, Tistory, Brunch + 글로벌 플랫폼 |
| **일본** | Twitter, YouTube, Note.com, Hatena Blog |
| **중국** | WeChat, Weibo, Bilibili (별도 검토 필요) |

### 언어/지역화 고려사항

1. **UI 다국어 지원** - i18n 적용 (Phase 후반)
2. **플랫폼 자동 감지** - URL 패턴으로 플랫폼 식별
3. **지역별 기본 플랫폼** - 사용자 locale에 따라 추천 플랫폼 조정
