# Architecture Documentation

## Overview

Refine is a Next.js-based Progressive Web App (PWA) for collecting and organizing links. It uses Supabase for backend services including authentication and database.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Pages     │  │  Components  │  │   Contexts   │          │
│  │              │  │              │  │              │          │
│  │ - index      │  │ - Header     │  │ - AuthContext│          │
│  │ - profile    │  │ - LinkCard   │  │              │          │
│  │ - login      │  │ - AddModal   │  │              │          │
│  │ - link/[id]  │  │ - Skeleton   │  │              │          │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘          │
│         │                                    │                  │
│         └────────────────┬───────────────────┘                  │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │   Hooks   │                                │
│                    │ useAuth() │                                │
│                    └─────┬─────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     API LAYER                                    │
├──────────────────────────┼──────────────────────────────────────┤
│         ┌────────────────┴────────────────┐                     │
│         │         API Routes              │                     │
│         │                                 │                     │
│         │  /api/save-shared-content       │                     │
│         │  /api/check-duplicate           │                     │
│         │  /api/delete-link               │                     │
│         │  /api/toggle-read               │                     │
│         │  /api/update-link               │                     │
│         │  /api/playlist                  │                     │
│         └────────────────┬────────────────┘                     │
│                          │                                      │
│         ┌────────────────┴────────────────┐                     │
│         │       Auth Middleware           │                     │
│         │       (lib/auth.ts)             │                     │
│         └────────────────┬────────────────┘                     │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    SUPABASE                                      │
├──────────────────────────┼──────────────────────────────────────┤
│         ┌────────────────┴────────────────┐                     │
│         │                                 │                     │
│    ┌────▼────┐                  ┌─────────▼─────────┐          │
│    │  Auth   │                  │     Database      │          │
│    │         │                  │                   │          │
│    │ Google  │                  │  shared_links     │          │
│    │ OAuth   │                  │  (with RLS)       │          │
│    └─────────┘                  └───────────────────┘          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

### `/pages` - Next.js Pages

```
pages/
├── _app.tsx          # App wrapper with AuthProvider
├── _document.tsx     # HTML document customization
├── index.tsx         # Main dashboard (protected)
├── profile.tsx       # User profile page (protected)
├── share.tsx         # PWA share target (protected)
├── auth/
│   ├── login.tsx     # Login page
│   └── callback.tsx  # OAuth callback handler
├── link/
│   └── [id].tsx      # Link detail page (public)
└── api/              # API routes
```

### `/components` - React Components

```
components/
├── common/           # Reusable UI components
│   ├── BaseCard.tsx      # Base card component
│   ├── ErrorBoundary.tsx # Error boundary wrapper
│   ├── PlatformIcon.tsx  # Platform icon renderer
│   ├── PrimaryButton.tsx # Primary button style
│   ├── RefineLogo.tsx    # Animated logo
│   ├── SEO.tsx           # SEO meta tags
│   └── Skeleton.tsx      # Loading skeletons
├── layout/           # Layout components
│   ├── Header.tsx        # App header with auth
│   └── LayoutShell.tsx   # Page layout wrapper
└── modules/          # Feature-specific components
    ├── AddLinkModal.tsx  # Add/edit link modal
    └── LinkCard.tsx      # Link display card
```

### `/lib` - Utilities and Services

```
lib/
├── auth.ts           # API authentication utilities
├── constants.ts      # App constants (categories, etc.)
├── supabase.ts       # Supabase client factory
├── url.ts            # URL normalization utilities
├── utils.ts          # General utilities
├── platforms/        # Platform-specific logic
│   ├── index.ts          # Platform detection
│   └── youtube.ts        # YouTube utilities
└── server/           # Server-only utilities
    └── scraper.ts        # OG metadata scraper
```

### `/contexts` - React Contexts

```
contexts/
└── AuthContext.tsx   # Global authentication state
```

---

## Authentication Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. UNAUTHENTICATED USER
   ┌────────────┐
   │   User     │
   │  visits /  │
   └─────┬──────┘
         │
         ▼
   ┌────────────┐      ┌────────────┐
   │  isLoading │ ───▶ │  No User   │
   │   true     │      │  Redirect  │
   └────────────┘      └─────┬──────┘
                             │
                             ▼
                       ┌────────────┐
                       │   Login    │
                       │   Page     │
                       └────────────┘

2. LOGIN PROCESS
   ┌────────────┐
   │   Click    │
   │  "Google"  │
   └─────┬──────┘
         │
         ▼
   ┌────────────────────┐
   │  Supabase OAuth    │
   │  signInWithOAuth() │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  Google Consent    │
   │  Screen            │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  /auth/callback    │
   │  Process tokens    │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  Redirect to /     │
   │  User logged in    │
   └────────────────────┘

3. AUTHENTICATED REQUESTS
   ┌────────────────────┐
   │  Client Request    │
   │  with Bearer token │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  API Route         │
   │  getAuthUser()     │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  Supabase Auth     │
   │  Verify token      │
   └─────────┬──────────┘
             │
             ▼
   ┌────────────────────┐
   │  Database Query    │
   │  with user_id      │
   └────────────────────┘
```

### Auth Context

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;           // Current user object
  session: Session | null;     // Current session with tokens
  isLoading: boolean;          // Auth state loading
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

### API Authentication

```typescript
// lib/auth.ts

// Get authenticated user from request
export async function getAuthUser(req: NextApiRequest) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

// Higher-order function for protected routes
export function withAuth(handler) {
  return async (req, res) => {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return handler(req, res, user);
  };
}
```

---

## Database Architecture

### Schema

```sql
-- shared_links table
CREATE TABLE shared_links (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  platform TEXT,
  image_url TEXT,
  category TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for user queries
CREATE INDEX idx_shared_links_user_id ON shared_links(user_id);

-- Index for URL lookups (duplicate checking)
CREATE INDEX idx_shared_links_url ON shared_links(url);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own links
CREATE POLICY "Users can view own links"
  ON shared_links FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert with their own user_id
CREATE POLICY "Users can insert own links"
  ON shared_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own links
CREATE POLICY "Users can update own links"
  ON shared_links FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can only delete their own links
CREATE POLICY "Users can delete own links"
  ON shared_links FOR DELETE
  USING (auth.uid() = user_id);
```

---

## URL Normalization

For duplicate detection, URLs are normalized:

```typescript
// lib/url.ts
export function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  
  // Remove tracking parameters
  const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', ...];
  trackingParams.forEach(p => parsed.searchParams.delete(p));
  
  // Normalize host (remove www)
  parsed.hostname = parsed.hostname.replace(/^www\./, '');
  
  // Remove trailing slash
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  
  return parsed.toString();
}

export function getUrlVariants(url: string): string[] {
  // Generate variants for duplicate checking
  // - with/without www
  // - with/without trailing slash
  // - normalized version
}
```

---

## Platform Detection

```typescript
// lib/platforms/index.ts
export type PlatformType = 
  | 'Youtube' 
  | 'Instagram' 
  | 'Threads' 
  | 'X (Twitter)' 
  | 'Facebook' 
  | 'LinkedIn' 
  | 'Naver' 
  | 'Velog' 
  | 'Medium' 
  | 'GitHub' 
  | 'Website';

export function detectPlatform(url: string): PlatformType {
  const host = new URL(url).hostname.toLowerCase();
  
  if (host.includes('youtube.com') || host.includes('youtu.be')) 
    return 'Youtube';
  if (host.includes('instagram.com')) 
    return 'Instagram';
  // ... more platforms
  
  return 'Website';
}
```

---

## State Management

### Client State

- **AuthContext**: Global authentication state
- **Local State**: Component-level state with `useState`
- **No Redux/Zustand**: Kept simple for current scope

### Server State

- **Supabase Realtime**: Not used (future consideration)
- **API Calls**: Direct fetch with auth headers
- **Caching**: Browser-level caching only

---

## Security Considerations

### Client-Side
- ✅ Auth tokens stored in Supabase SDK (localStorage)
- ✅ No sensitive data in client-side code
- ✅ HTTPS only in production

### Server-Side
- ✅ All API routes validate auth tokens
- ✅ Service role key only used server-side
- ✅ Input validation on all endpoints

### Database
- ✅ Row Level Security enabled
- ✅ Foreign key constraints
- ✅ Cascading deletes for user data

---

## Performance Optimizations

See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) for details.

### Key Points
- Next.js Image optimization
- Code splitting via dynamic imports
- Skeleton loading states
- Efficient Supabase queries

---

## Future Considerations

### Scalability
- [ ] Add Redis caching for API responses
- [ ] Implement pagination/infinite scroll
- [ ] Add full-text search with PostgreSQL

### Features
- [ ] Real-time updates with Supabase Realtime
- [ ] Background sync for offline support
- [ ] Push notifications for reminders
