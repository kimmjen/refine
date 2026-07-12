import { describe, it, expect } from 'vitest';
import { normalizeUrl, ensureProtocol } from '../lib/url';

describe('ensureProtocol', () => {
    it('adds https:// to bare domain', () => {
        expect(ensureProtocol('example.com')).toBe('https://example.com');
    });

    it('keeps existing https://', () => {
        expect(ensureProtocol('https://example.com')).toBe('https://example.com');
    });

    it('keeps existing http://', () => {
        expect(ensureProtocol('http://example.com')).toBe('http://example.com');
    });

    it('handles empty string', () => {
        const result = ensureProtocol('');
        expect(result).toBeDefined();
    });

    it('handles URL with path', () => {
        expect(ensureProtocol('example.com/path/to/page')).toBe('https://example.com/path/to/page');
    });
});

describe('normalizeUrl edge cases', () => {
    it('removes trailing slash', () => {
        const result = normalizeUrl('https://example.com/');
        expect(result.endsWith('/')).toBe(false);
    });

    it('removes www prefix', () => {
        const result = normalizeUrl('https://www.example.com');
        expect(result).not.toContain('www.');
    });

    it('lowercases hostname', () => {
        const result = normalizeUrl('https://EXAMPLE.COM/Path');
        expect(result).toContain('example.com');
    });

    it('handles URLs with query parameters', () => {
        const result = normalizeUrl('https://example.com/page?utm_source=twitter&ref=123');
        expect(result).toBeDefined();
    });

    it('handles URLs with hash fragments', () => {
        const result = normalizeUrl('https://example.com/page#section');
        expect(result).toBeDefined();
    });

    it('handles YouTube URLs consistently', () => {
        const url1 = normalizeUrl('https://www.youtube.com/watch?v=abc123');
        const url2 = normalizeUrl('https://youtube.com/watch?v=abc123');
        expect(url1).toBe(url2);
    });
});
