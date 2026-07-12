import { describe, it, expect } from 'vitest';
import { normalizeUrl, getUrlVariants, ensureProtocol } from '../lib/url';
import { detectPlatform, isVideoPlatform, isSocialPlatform } from '../lib/platforms';
import { CATEGORIES, DEFAULT_CATEGORIES } from '../lib/constants';

// ─── URL Utilities ──────────────────────────────────────────

describe('normalizeUrl', () => {
    it('removes www prefix', () => {
        expect(normalizeUrl('https://www.example.com/path')).toBe('example.com/path');
    });

    it('removes trailing slash', () => {
        expect(normalizeUrl('https://example.com/path/')).toBe('example.com/path');
    });

    it('lowercases hostname', () => {
        expect(normalizeUrl('https://EXAMPLE.COM/Path')).toBe('example.com/Path');
    });

    it('preserves query parameters', () => {
        expect(normalizeUrl('https://example.com/page?id=1')).toBe('example.com/page?id=1');
    });

    it('returns lowercase for invalid URLs', () => {
        expect(normalizeUrl('not-a-url')).toBe('not-a-url');
    });
});

describe('getUrlVariants', () => {
    it('generates http/https and www/no-www variants', () => {
        const variants = getUrlVariants('https://example.com/page');
        expect(variants).toContain('https://example.com/page');
        expect(variants).toContain('http://example.com/page');
        expect(variants).toContain('https://www.example.com/page');
        expect(variants).toContain('http://www.example.com/page');
    });

    it('generates trailing slash variants', () => {
        const variants = getUrlVariants('https://example.com/page');
        expect(variants).toContain('https://example.com/page/');
    });

    it('returns unique values only', () => {
        const variants = getUrlVariants('https://example.com');
        const uniqueCount = new Set(variants).size;
        expect(uniqueCount).toBe(variants.length);
    });

    it('returns original for invalid URLs', () => {
        expect(getUrlVariants('invalid')).toEqual(['invalid']);
    });
});

describe('ensureProtocol', () => {
    it('adds https:// to bare domains', () => {
        expect(ensureProtocol('example.com')).toBe('https://example.com');
    });

    it('keeps existing http://', () => {
        expect(ensureProtocol('http://example.com')).toBe('http://example.com');
    });

    it('keeps existing https://', () => {
        expect(ensureProtocol('https://example.com')).toBe('https://example.com');
    });

    it('returns empty string for null/undefined', () => {
        expect(ensureProtocol(null)).toBe('');
        expect(ensureProtocol(undefined)).toBe('');
    });
});

// ─── Platform Detection ─────────────────────────────────────

describe('detectPlatform', () => {
    it('detects YouTube', () => {
        expect(detectPlatform('https://www.youtube.com/watch?v=123')).toBe('YouTube');
        expect(detectPlatform('https://youtu.be/123')).toBe('YouTube');
    });

    it('detects GitHub', () => {
        expect(detectPlatform('https://github.com/vercel/next.js')).toBe('GitHub');
    });

    it('detects Twitter/X', () => {
        expect(detectPlatform('https://twitter.com/user/status/123')).toBe('X (Twitter)');
        expect(detectPlatform('https://x.com/user/status/123')).toBe('X (Twitter)');
    });

    it('detects Instagram', () => {
        expect(detectPlatform('https://www.instagram.com/p/abc123')).toBe('Instagram');
    });

    it('detects Reddit', () => {
        expect(detectPlatform('https://www.reddit.com/r/programming')).toBe('Reddit');
    });

    it('detects TikTok', () => {
        expect(detectPlatform('https://www.tiktok.com/@user/video/123')).toBe('TikTok');
    });

    it('detects Naver', () => {
        expect(detectPlatform('https://blog.naver.com/user/123')).toBe('Naver');
    });

    it('detects new platforms from expanded map', () => {
        expect(detectPlatform('https://www.notion.so/page')).toBe('Notion');
        expect(detectPlatform('https://www.figma.com/file/abc')).toBe('Figma');
        expect(detectPlatform('https://stackoverflow.com/questions/123')).toBe('Stack Overflow');
        expect(detectPlatform('https://dev.to/user/post')).toBe('DEV');
        expect(detectPlatform('https://open.spotify.com/track/123')).toBe('Spotify');
        expect(detectPlatform('https://discord.gg/invite')).toBe('Discord');
        expect(detectPlatform('https://www.producthunt.com/posts/app')).toBe('Product Hunt');
        expect(detectPlatform('https://news.ycombinator.com/item?id=123')).toBe('Hacker News');
        expect(detectPlatform('https://tistory.com/123')).toBe('Tistory');
        expect(detectPlatform('https://brunch.co.kr/@user/123')).toBe('Brunch');
    });

    it('extracts site name from unknown domains', () => {
        expect(detectPlatform('https://coolsite.io/page')).toBe('Coolsite');
        expect(detectPlatform('https://my-blog.dev/post')).toBe('My Blog');
        expect(detectPlatform('https://example.co.kr/page')).toBe('Example');
    });

    it('returns Website for invalid URLs', () => {
        expect(detectPlatform('not-a-url')).toBe('Website');
    });
});

describe('isVideoPlatform', () => {
    it('returns true for YouTube', () => {
        expect(isVideoPlatform('YouTube')).toBe(true);
    });

    it('returns true for TikTok', () => {
        expect(isVideoPlatform('TikTok')).toBe(true);
    });

    it('returns true for Twitch', () => {
        expect(isVideoPlatform('Twitch')).toBe(true);
    });

    it('returns false for GitHub', () => {
        expect(isVideoPlatform('GitHub')).toBe(false);
    });
});

describe('isSocialPlatform', () => {
    it('returns true for social platforms', () => {
        expect(isSocialPlatform('Instagram')).toBe(true);
        expect(isSocialPlatform('X (Twitter)')).toBe(true);
        expect(isSocialPlatform('Reddit')).toBe(true);
        expect(isSocialPlatform('Bluesky')).toBe(true);
    });

    it('returns false for non-social platforms', () => {
        expect(isSocialPlatform('GitHub')).toBe(false);
        expect(isSocialPlatform('YouTube')).toBe(false);
    });
});

// ─── Constants ──────────────────────────────────────────────

describe('CATEGORIES', () => {
    it('contains Etc as the last category', () => {
        expect(CATEGORIES[CATEGORIES.length - 1]).toBe('Etc');
    });

    it('has no duplicates', () => {
        const uniqueCount = new Set(CATEGORIES).size;
        expect(uniqueCount).toBe(CATEGORIES.length);
    });

    it('CATEGORIES and DEFAULT_CATEGORIES are identical', () => {
        expect(CATEGORIES).toEqual(DEFAULT_CATEGORIES);
    });
});
