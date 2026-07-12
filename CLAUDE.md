# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Refine is an AI-powered link collector PWA built with Next.js 16 (Pages Router), React 19, Supabase, and Gemini AI. It lets users save, organize, and enrich bookmarks with automatic AI classification, summaries, and tagging. Supports English and Korean (254 translation keys).

## Commands

```bash
pnpm dev          # Start dev server (Next.js with webpack — Turbopack intentionally disabled)
pnpm build        # Production build (also uses --webpack flag)
pnpm start        # Run production server
pnpm lint         # ESLint
pnpm test         # Run all tests (vitest, 72 tests)
pnpm test:watch   # Watch mode
pnpm test __tests__/auth.test.ts  # Run a single test file
```

## Architecture

**Stack:** Next.js 16 Pages Router, React 19 (with React Compiler enabled), TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth + Storage), Gemini 2.0 Flash, SWR, next-i18next

**Path alias:** `@/*` maps to the project root (e.g., `@/lib/auth` -> `./lib/auth`).

**Routing:** File-based via `/pages`. Public routes under `/auth/*`, protected routes everywhere else. Admin pages at `/admin/` require admin role.

**Auth flow:** Google OAuth via Supabase Auth -> `/auth/callback` handles redirect -> session stored in localStorage (`refine-auth`) -> `contexts/AuthContext.tsx` is the single source of client-side user state -> API routes validate Bearer token via `withAuth()` wrapper from `lib/auth.ts`.

**Admin auth:** `withAdmin()` wrapper in `lib/auth.ts` checks the `admin_users` DB table first, falls back to `user_metadata.role === 'admin'`. Use `withAdmin()` (not `withAuth()`) for admin API routes.

**Two Supabase clients:**
- `createSupabaseBrowserClient()` -- singleton, client-side with anon key, respects RLS
- `createSupabaseServerClient()` -- server-side with Service Role Key, bypasses RLS. Used in API routes; never expose to browser.

**Data fetching:** SWR hooks in `/hooks` (useLinks, useLinkActions, useCategories, useYoutubePlaylist). API routes in `/pages/api` use `withAuth()` for auth and `createSupabaseServerClient()` for DB access. Pagination is cursor-based with PAGE_SIZE=20. Tests live as flat files in `__tests__/` (no co-location).

**AI pipeline (`lib/gemini.ts`):** When a link is saved via `/api/save-shared-content`, it runs classification (23 categories), summary generation, and tag extraction using Gemini 2.0 Flash (10s timeout). Manual enrichment via `/api/enrich-link`, bulk via `/api/backfill-categories` (category + summary + tags).

**Platform detection (`lib/platforms/index.ts`):** Recognizes 100+ platforms from URLs. Falls back to domain name extraction. Platform-specific metadata fetching in `lib/server/platform-metadata.ts` with custom user-agents per platform. All external fetches have 5s timeout.

**Error logging:** Supabase-based error logging via `lib/error-logger.ts`. Client errors sent to `/api/error-log`. API errors logged via `apiError()` from `lib/api-response.ts`. Viewable in Admin > Error Logs tab.

**Security:** All mutable API endpoints require authentication (`withAuth`) and rate limiting (`applyRateLimit`, 10 req/min). Security headers configured in `next.config.mjs`. Input validation with field whitelists on `update-link` and sortBy validation on `admin/db`.

**Components structure:**
- `components/ui/` -- shadcn/ui primitives (do not edit manually, use shadcn CLI)
- `components/common/` -- shared components (ErrorBoundary, PlatformIcon, Toast, SEO)
- `components/modules/` -- feature modules (`admin/`, `link/`) plus top-level modals (AddLinkModal, iOSGuideModal, etc.)
- `components/layout/` -- app shell (LayoutShell, Header)

**Admin API routes (`pages/api/admin/`):** check.ts, db.ts, sql.ts, stats.ts, users.ts — all protected by `withAdmin()`. `pages/api/dispatch/cura.ts` handles the share dispatch flow.

## Key Database Tables

- `shared_links` -- main link storage (url, title, platform, category, is_read, user_id)
- `link_metadata` -- platform-specific fields + AI results (ai_summary, ai_tags)
- `user_categories` -- custom categories per user with sort_order
- `ai_settings` -- per-user AI provider config and preferences
- `admin_users` -- tracks which users have admin privileges
- `error_logs` -- application error logging (level, source, message, stack, path)

All tables use Row Level Security (RLS) scoped by user_id. The server client (`createSupabaseServerClient`) bypasses RLS via Service Role Key.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Client-side anon key (NOT service_role)
SUPABASE_SERVICE_ROLE_KEY     # Server-side only
GEMINI_API_KEY                # Google Gemini API
```

## Conventions

- i18n: Two locales (en, ko). Translations in `/public/locales/{en,ko}/common.json`. Use `useTranslation('common')` hook. All pages must have `getStaticProps`/`getServerSideProps` with `serverSideTranslations(locale, ['common'], nextI18NextConfig)`.
- Theming: Light/dark via `next-themes` with Tailwind CSS semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`). Class-based dark mode (`.dark`). Do not use hardcoded colors like `bg-white` or `text-gray-500`.
- UI Components: Use shadcn/ui components (`Button`, `Input`, `Card`, `Alert`, `ScrollArea`, etc.) instead of native HTML elements. Do not use `<button>` or `<input>` directly.
- URL handling: Always use `normalizeUrl()` and `ensureProtocol()` from `lib/url.ts` for URL comparison and storage.
- API responses: Use `apiError()` and `apiSuccess()` from `lib/api-response.ts` for consistent response format and automatic error logging.
- Migrations: Supabase SQL migrations in `/supabase/migrations/` numbered sequentially (001-009).
- PWA: Share Target API for Android. iOS uses clipboard paste workaround. PWA is disabled in development mode.
- Error monitoring: Supabase-based error logging via `lib/error-logger.ts`. Admin Error Logs tab for viewing.
- Git workflow: issue -> branch -> PR -> merge. Branch naming: `feat/issue-desc` or `fix/issue-desc`.
