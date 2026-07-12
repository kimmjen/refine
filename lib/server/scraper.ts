/**
 * 서버 전용 스크래핑 유틸리티
 * cheerio 의존성이 있으므로 서버에서만 사용
 * 플랫폼별 User-Agent 전략 적용
 */

import * as cheerio from 'cheerio';
import { isLoginWall } from '@/lib/platforms';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * 플랫폼별 최적 User-Agent 반환
 * LinkedIn → Googlebot, Twitter/X → Twitterbot 사용 시 OG 메타데이터 접근 가능
 */
function getHeadersForUrl(url: string): Record<string, string> {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const headers = { ...DEFAULT_HEADERS };

    if (hostname.includes('linkedin.com')) {
      headers['User-Agent'] = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      headers['User-Agent'] = 'Twitterbot/1.1';
    } else if (hostname.includes('threads.net') || hostname.includes('threads.com')) {
      headers['User-Agent'] = 'facebookexternalhit/1.1';
    }

    return headers;
  } catch {
    return DEFAULT_HEADERS;
  }
}

/**
 * URL에서 username 추출 (소셜 미디어용)
 */
function extractUsernameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
    const path = urlObj.pathname;

    // Instagram: /username/ or /username/p/xxx
    if (hostname.includes('instagram.com')) {
      const match = path.match(/^\/([^\/]+)/);
      if (match && !['p', 'reel', 'stories', 'explore', 'accounts'].includes(match[1])) {
        return match[1];
      }
    }

    // Twitter/X: /username or /username/status/xxx
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      const match = path.match(/^\/([^\/]+)/);
      if (match && !['search', 'explore', 'settings', 'i', 'home', 'hashtag'].includes(match[1])) {
        return match[1];
      }
    }

    // Threads: /@username
    if (hostname.includes('threads.net') || hostname.includes('threads.com')) {
      const match = path.match(/^\/@([^\/]+)/);
      if (match) return match[1];
    }

    // GitHub: /username or /username/repo
    if (hostname.includes('github.com')) {
      const match = path.match(/^\/([^\/]+)/);
      if (match && !['settings', 'explore', 'marketplace', 'notifications', 'login'].includes(match[1])) {
        return match[1];
      }
    }

    // YouTube: /@channel or /channel/xxx
    if (hostname.includes('youtube.com')) {
      const match = path.match(/^\/@([^\/]+)/);
      if (match) return match[1];
    }

    // TikTok: /@username
    if (hostname.includes('tiktok.com')) {
      const match = path.match(/^\/@([^\/]+)/);
      if (match) return match[1];
    }

    // LinkedIn: /in/username or /company/name
    if (hostname.includes('linkedin.com')) {
      const match = path.match(/^\/(in|company)\/([^\/]+)/);
      if (match) return match[2];
    }

    return null;
  } catch {
    return null;
  }
}

export interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  videos: string[];
  author: string | null;
  username: string | null;
}

/**
 * URL에서 Open Graph 이미지 추출
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  const meta = await fetchOgMetadata(url);
  return meta.image;
}

/**
 * URL에서 모든 Open Graph 메타데이터 추출
 * 플랫폼별 최적 User-Agent 사용
 */
export async function fetchOgMetadata(url: string): Promise<ScrapedMetadata> {
  try {
    const headers = getHeadersForUrl(url);
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      return { 
        title: null, 
        description: null, 
        image: null, 
        images: [],
        videos: [],
        author: null, 
        username: extractUsernameFromUrl(url) 
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() || null;

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') || null;

    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="twitter:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') || null;

    const images: string[] = [];
    $('meta[property="og:image"]').each((_, el) => {
      const src = $(el).attr('content');
      if (src) images.push(src);
    });
    
    $('meta[name="twitter:image"]').each((_, el) => {
      const src = $(el).attr('content');
      if (src) images.push(src);
    });

    const videos: string[] = [];
    $('meta[property="og:video"]').each((_, el) => {
      const src = $(el).attr('content');
      if (src) videos.push(src);
    });

    const resolveUrl = (relativeUrl: string) => {
      if (!relativeUrl) return null;
      if (relativeUrl.startsWith('http')) return relativeUrl;
      try {
        const baseUrl = new URL(url).origin;
        return new URL(relativeUrl, baseUrl).toString();
      } catch {
        return null;
      }
    };

    if (image) image = resolveUrl(image);
    
    const uniqueImages = Array.from(new Set(images.map(img => resolveUrl(img)).filter((img): img is string => !!img)));
    const uniqueVideos = Array.from(new Set(videos.map(vid => resolveUrl(vid)).filter((vid): vid is string => !!vid)));

    // Author 추출
    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('meta[property="og:site_name"]').attr('content') || null;

    // Username 추출 (URL 기반)
    const username = extractUsernameFromUrl(url);

    const trimmedTitle = title?.trim() || null;
    const trimmedDescription = description?.trim() || null;

    if (isLoginWall(trimmedTitle, trimmedDescription)) {
      return { title: null, description: null, image: null, images: [], videos: [], author: null, username };
    }

    return {
      title: trimmedTitle,
      description: trimmedDescription,
      image,
      images: uniqueImages,
      videos: uniqueVideos,
      author: author?.trim() || null,
      username,
    };
  } catch {
    return { title: null, description: null, image: null, images: [], videos: [], author: null, username: null };
  }
}

/**
 * URL에서 Open Graph 타이틀 추출
 */
export async function fetchOgTitle(url: string): Promise<string | null> {
  const meta = await fetchOgMetadata(url);
  return meta.title;
}

/**
 * URL에서 Open Graph 설명 추출
 */
export async function fetchOgDescription(url: string): Promise<string | null> {
  const meta = await fetchOgMetadata(url);
  return meta.description;
}
