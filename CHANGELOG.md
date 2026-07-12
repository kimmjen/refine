# Refine Changelog

All notable changes to the "Refine" project will be documented in this file.

## [3.0.0] - 2026-04-14

### Production Readiness Overhaul
Comprehensive production-readiness improvements across security, i18n, stability, performance, and architecture. 34 PRs merged.

### Internationalization (i18n)
- Full bilingual support (English / Korean) with 244 translation keys.
- `useTranslation()` applied to all pages and components.
- `serverSideTranslations` with explicit config on all pages.
- Locale switching via header dropdown and settings page.
- AI output language per-user preference with actual locale change.

### Security
- **Auth enforcement:** Added `withAuth` + `user_id` ownership check to `/api/link/[id]`, `/api/enrich-link`, `/api/playlist`.
- **Security headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy via `next.config.mjs`.
- **Input validation:** Field whitelist on `update-link`, sortBy whitelist on `admin/db`, search length limit.
- **GET token removal:** Removed `?token=JWT` query parameter from `save-shared-content` (POST only).
- **Rate limiting:** Expanded from 1 endpoint to 6 (all mutable APIs, 10 req/min per user).
- **RLS policies:** Added to `link_metadata` and `link_images` tables.

### Stability
- **Error logging:** Replaced Sentry (placeholder) with Supabase-based error logging system.
  - `error_logs` table, `lib/error-logger.ts`, `/api/error-log` endpoint.
  - ErrorBoundary sends client errors to API.
  - Admin Error Logs tab with level/source filtering.
- **Fetch timeouts:** 5s for scraping/external APIs, 10s for Gemini AI.
- **Hook error states:** `useLinks` and `useLinkActions` now expose `error` state.
- **API error utility:** `apiError()` / `apiSuccess()` for consistent responses + auto logging.

### Performance
- **DB indexes:** `(user_id, is_read)`, `(user_id, category)`, `(user_id, created_at DESC)`.
- **Image optimization:** Removed `unoptimized` from LinkCard Image (enables WebP/AVIF).
- **Admin stats:** `listUsers` changed from perPage=1000 to perPage=1 + total field.

### Architecture
- **API response format:** Unified `{ error: string }` / `{ success: true }` via shared utility.
- **Top-level client fix:** `categories.ts` Supabase client moved from module level to function scope.
- **Sentry removal:** Removed `@sentry/nextjs` dependency and placeholder config.

### UI Consistency (Style Guide)
- Replaced ~20 native `<button>` with shadcn `Button` component.
- Replaced native `<input>` with `Input` component.
- Replaced `alert()` calls with `useToast()` hook.
- Replaced hardcoded colors (`bg-white`, `text-gray-*`) with semantic tokens (`bg-card`, `text-foreground`).
- Applied `ScrollArea`, `Alert` components from style guide.

### Testing
- Test count: 46 -> 72 (6 test files).
- New: `auth.test.ts`, `api-response.test.ts`, `rate-limit.test.ts`, `url-extended.test.ts`.

### AI Enhancement
- `backfill-categories` API expanded: now performs category + summary + tags (previously category only).
- Respects user `ai_settings` (provider, language, auto features).

---

## [2.1.0] - 2025-12-25

### Features
- **Video Carousel Support:** Image and video (mp4, mov, webm, gif) display in carousel.
- **Instagram Scraper Improvements:** Accurate carousel image count extraction, profile photo filtering.

### UI/Design Changes
- **Slate Design System:** Unified UI to Slate theme.
- **PWA Icons:** Updated icons to match new design system.
- **Share Page:** Improved share page UI and status display.
- **Link Detail Page:** Mobile UX improvements.

### Bug Fixes
- **Dashboard Stats:** Fixed Read/Unread count mismatch with Total.

---

## [2.0.0] - 2025-12-16

### Authentication (Major Feature)
- **Google OAuth:** Supabase Auth with Google OAuth provider.
- **Multi-user Support:** Data isolated with `user_id` foreign key.
- **Protected Routes:** All API endpoints require authentication.
- **Row Level Security:** Database-level access control via Supabase RLS.

### New Pages
- **Login Page** (`/auth/login`): Google OAuth login.
- **Callback Page** (`/auth/callback`): OAuth callback handler.
- **Profile Page** (`/profile`): User info, statistics, data export, sign out.

### URL Duplicate Detection
- Smart URL normalization and variant matching.
- User-scoped duplicate checking.

### Architecture
- Modular structure: `lib/url.ts`, `lib/platforms/`, `lib/server/`, `lib/auth.ts`.
- Singleton Supabase browser client, separate server/browser factories.

---

## [1.2.0] - 2025-12-16

### Added
- **Intro Animation:** Splash screen with Framer Motion.
- **YouTube Integration:** Full support for Shorts, Playlists, internal proxy API.
- **Optimistic Updates:** Instant UI feedback for read status toggle.

---

## [1.1.0] - 2024-05-21

### Features
- **Smart Dashboard:** Search, category filters, Grid/List view toggle.
- **Read Status Management:** Archive system, quick toggle.
- **Category System:** 18 categories, edit from detail page.
- **YouTube Embed:** Video playback in detail page.

---

## [1.0.1] - 2024-05-20

### Features
- Auto platform detection from URL.
- Server-side OG image scraping.
- Full TypeScript migration.

### Bug Fixes
- Android share sheet PWA issue.
- Next.js 16 Turbopack conflict (forced Webpack).

---

## [1.0.0] - Initial Release
- Web Share Target API integration.
- Supabase database setup.
- Core dashboard and link card UI.
