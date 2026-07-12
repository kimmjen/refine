# 기술 품질 개선 가이드

프로젝트 안정성과 품질 향상을 위한 개선 항목입니다.

---

## 📋 체크리스트

- [ ] 에러 바운더리 추가
- [ ] SEO 메타태그 최적화
- [ ] Lighthouse 성능 개선
- [ ] 환경별 설정 분리 (dev/prod)

---

## 1️⃣ 에러 바운더리 추가

### 목적
React 컴포넌트 에러 발생 시 앱 전체가 죽지 않고, 사용자 친화적인 에러 화면 표시

### 구현 파일

#### `components/common/ErrorBoundary.tsx`

```typescript
import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 서비스로 전송 (Sentry 등)
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center bg-primary p-6">
          <AlertTriangle size={64} className="text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-text-head mb-2">
            문제가 발생했습니다
          </h2>
          <p className="text-text-body mb-6 text-center">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-accent text-text-head font-bold rounded-xl"
          >
            <RefreshCw size={18} />
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 적용 위치

#### `pages/_app.tsx` 수정

```typescript
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}
```

### 선택: 에러 로깅 서비스 연동

```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

---

## 2️⃣ SEO 메타태그 최적화

### 목적
검색엔진 최적화 및 SNS 공유 시 미리보기 개선

### 구현 파일

#### `components/common/SEO.tsx`

```typescript
import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const DEFAULT = {
  title: 'Refine - Link Collector',
  description: 'Collect, refine, and organize your shared links.',
  image: '/og-image.png', // 1200x630 권장
  url: 'https://your-domain.com',
};

export default function SEO({ 
  title = DEFAULT.title,
  description = DEFAULT.description,
  image = DEFAULT.image,
  url = DEFAULT.url,
}: SEOProps) {
  const fullTitle = title === DEFAULT.title ? title : `${title} | Refine`;

  return (
    <Head>
      {/* 기본 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />

      {/* Open Graph (Facebook, Discord, Slack 등) */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Refine" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* PWA */}
      <meta name="theme-color" content="#E6E7E3" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    </Head>
  );
}
```

### 사용 예시

```typescript
// pages/index.tsx
import SEO from '@/components/common/SEO';

export default function Home() {
  return (
    <>
      <SEO 
        title="My Library"
        description="저장한 링크들을 확인하세요."
      />
      {/* ... */}
    </>
  );
}

// pages/link/[id].tsx
<SEO 
  title={link.title}
  description={link.description}
  image={link.image_url}
/>
```

### 필요한 파일

- `/public/og-image.png` (1200x630px) - SNS 공유용 대표 이미지

---

## 3️⃣ Lighthouse 성능 개선

### 주요 지표

| 지표 | 설명 | 목표 |
|------|------|------|
| **LCP** | Largest Contentful Paint | < 2.5초 |
| **FID** | First Input Delay | < 100ms |
| **CLS** | Cumulative Layout Shift | < 0.1 |
| **Performance** | 종합 점수 | > 90점 |

### 개선 방법

#### 3-1. 이미지 최적화

```typescript
// next.config.mjs
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐시
  },
};

export default nextConfig;
```

```typescript
// 컴포넌트에서 Image 컴포넌트 사용
import Image from 'next/image';

// 기존
<img src={imageUrl} alt={title} />

// 개선
<Image
  src={imageUrl}
  alt={title}
  width={400}
  height={200}
  loading="lazy"
/>
```

#### 3-2. 폰트 최적화

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        {/* 폰트 preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 외부 리소스 DNS prefetch */}
        <link rel="dns-prefetch" href="https://img.youtube.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

#### 3-3. 번들 크기 분석 (선택)

```bash
pnpm add -D @next/bundle-analyzer
```

```javascript
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

```bash
# 분석 실행
ANALYZE=true pnpm build
```

#### 3-4. Skeleton UI (CLS 개선)

```typescript
// components/common/LinkCardSkeleton.tsx
export default function LinkCardSkeleton() {
  return (
    <div className="bg-white rounded-refine p-6 animate-pulse">
      <div className="flex gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-full mb-2" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
    </div>
  );
}
```

### 측정 방법

```bash
# Chrome DevTools > Lighthouse 탭
# 또는 https://pagespeed.web.dev/
```

---

## 4️⃣ 환경별 설정 분리 (dev/prod)

### 파일 구조

```
/
├── .env.local          # 로컬 개발용 (git 무시)
├── .env.development    # 개발 환경 기본값
├── .env.production     # 프로덕션 환경
└── .env.example        # 템플릿 (git 포함)
```

### 파일 내용

#### `.env.example` (팀원 공유용, git 포함)

```bash
# ===================
# Supabase
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===================
# App Configuration
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# ===================
# Analytics (optional)
# ===================
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

#### `.env.development`

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
```

#### `.env.production`

```bash
NEXT_PUBLIC_APP_URL=https://refine.your-domain.com
NEXT_PUBLIC_APP_ENV=production
```

### 환경별 분기 유틸리티

#### `lib/config.ts`

```typescript
export const config = {
  // 환경 판별
  isDev: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  isProd: process.env.NEXT_PUBLIC_APP_ENV === 'production',
  
  // URLs
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  
  // Feature Flags (환경별로 다르게 설정 가능)
  enableAnalytics: process.env.NEXT_PUBLIC_APP_ENV === 'production',
};
```

### 사용 예시

```typescript
import { config } from '@/lib/config';

// 개발 모드에서만 로그 출력
if (config.isDev) {
  console.log('Debug:', data);
}

// 프로덕션에서만 Analytics 활성화
if (config.enableAnalytics) {
  gtag('event', 'page_view');
}
```

### .gitignore 설정

```gitignore
# 환경 변수 (민감 정보)
.env
.env.local
.env.*.local

# .env.example은 포함
!.env.example
```

---

## 📊 구현 우선순위 추천

| 순위 | 항목 | 난이도 | 예상 시간 | 효과 |
|------|------|--------|----------|------|
| 1 | 환경별 설정 분리 | ⭐ | 30분 | 배포 안정성 |
| 2 | SEO 메타태그 | ⭐⭐ | 1시간 | 검색/공유 |
| 3 | 에러 바운더리 | ⭐⭐ | 1시간 | 안정성 |
| 4 | Lighthouse 성능 | ⭐⭐⭐ | 2~3시간 | 사용자 경험 |

---

## 🔗 참고 자료

- [Next.js Error Handling](https://nextjs.org/docs/pages/building-your-application/configuring/error-handling)
- [Next.js SEO](https://nextjs.org/learn/seo/introduction-to-seo)
- [Web Vitals](https://web.dev/vitals/)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)
