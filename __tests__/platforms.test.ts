import { describe, it, expect } from 'vitest';
import { detectPlatform, isSocialPlatform } from '../lib/platforms';

describe('detectPlatform', () => {
    it('detects Threads from threads.net', () => {
        expect(detectPlatform('https://www.threads.net/@username/post/abc123')).toBe('Threads');
    });

    it('detects Threads from threads.com', () => {
        expect(detectPlatform('https://www.threads.com/@username/post/abc123')).toBe('Threads');
    });

    it('detects Threads from threads.com (no www)', () => {
        expect(detectPlatform('https://threads.com/@username')).toBe('Threads');
    });

    it('detects YouTube', () => {
        expect(detectPlatform('https://www.youtube.com/watch?v=abc')).toBe('YouTube');
        expect(detectPlatform('https://youtu.be/abc')).toBe('YouTube');
    });

    it('detects X/Twitter', () => {
        expect(detectPlatform('https://x.com/user/status/123')).toBe('X (Twitter)');
        expect(detectPlatform('https://twitter.com/user/status/123')).toBe('X (Twitter)');
    });

    it('falls back to domain name for unknown platforms', () => {
        const result = detectPlatform('https://random-blog.example.org/post');
        expect(result).toBeTruthy();
    });
});

describe('isSocialPlatform', () => {
    it('classifies Threads as social', () => {
        expect(isSocialPlatform('Threads')).toBe(true);
    });

    it('classifies Instagram as social', () => {
        expect(isSocialPlatform('Instagram')).toBe(true);
    });

    it('does not classify GitHub as social', () => {
        expect(isSocialPlatform('GitHub')).toBe(false);
    });
});
