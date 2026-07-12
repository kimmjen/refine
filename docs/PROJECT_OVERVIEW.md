# Refine Project Overview

## 🌟 Vision
Refine is a high-performance, mobile-first personal knowledge management (PKM) tool designed for the modern information consumer. It bridges the gap between discovering content on mobile devices and organizing it for future reference. By leveraging PWA technology and smart automation, Refine makes capturing and curating links effortless.

## 🚀 Core Value Proposition
- **Effortless Capture**: Save links directly from any mobile app using the native share sheet.
- **Smart Organization**: Automatic platform detection and category classification.
- **Enhanced Media Experience**: Integrated players for YouTube and rich previews for diverse platforms.
- **Personalized Curation**: A clean, distraction-free environment for organizing your digital library.

## 🛠 Main Features

### 1. Mobile-First Capture (PWA)
- **Share Target API**: Registered as a system share target on Android, allowing one-tap saving.
- **URL Normalization**: Automatically cleans tracking parameters and normalizes URLs to prevent duplicates.
- **Fast Save**: Minimalist interface for quick saving without breaking the user's flow.

### 2. Intelligent Categorization
- **Auto-Detection**: Recognizes platforms like YouTube, GitHub, X (Twitter), Instagram, Naver, etc.
- **Category System**: Predefined categories including IT/Tech, AI/GPT, Design, Business, Life, and more.
- **OG Metadata Scraping**: Automatically extracts titles, descriptions, and high-quality thumbnails using server-side scraping.

### 3. Rich Media Integration
- **YouTube Ecosystem**: Custom player supporting standard videos, Shorts, and auto-loading playlists.
- **Platform-Specific Cards**: Tailored UI for different content types (e.g., repository stats for GitHub, post previews for X).

### 4. Knowledge Management
- **Inbox/Archive**: Manage reading status to keep your library organized.
- **Quick Search**: Real-time filtering by title, description, or URL.
- **Category Management**: Easily reassign or browse by specific categories.

## 💻 Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 16 (Pages Router) | Optimized SSR/ISR, robust API routes, and seamless deployment. |
| **Language** | TypeScript | Type safety and improved developer experience. |
| **Frontend** | React 19, Tailwind CSS 4 | Cutting-edge UI performance and modern styling capabilities. |
| **Database** | Supabase (PostgreSQL) | Scalable relational database with built-in RLS and real-time features. |
| **Auth** | Supabase Auth (Google) | Secure, managed authentication with easy OAuth integration. |
| **Storage** | Supabase Storage | Reliable hosting for user-uploaded or scraped media assets. |
| **PWA** | @ducanh2912/next-pwa | Best-in-class PWA support for Next.js. |
| **Scraping** | Cheerio | Fast and efficient server-side HTML parsing. |

## 📐 Architecture at a Glance
Refine follows a modern serverless architecture:
1. **Frontend**: A React-based PWA that communicates with Next.js API routes.
2. **API Layer**: Secure endpoints for metadata extraction, link management, and user data.
3. **Backend-as-a-Service**: Supabase handles the database, authentication, and security policies (RLS).
4. **Integration**: External platform APIs (YouTube Data API, etc.) and OG scraping services.

---
*Last Updated: January 2026*
