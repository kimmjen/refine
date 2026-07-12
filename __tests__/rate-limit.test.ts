import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiResponse } from 'next';

function createMockRes() {
    const res: Partial<NextApiResponse> & { _status: number; _json: unknown } = {
        _status: 200,
        _json: null,
        status: vi.fn(function (this: typeof res, code: number) { this._status = code; return this as NextApiResponse; }),
        json: vi.fn(function (this: typeof res, data: unknown) { this._json = data; return this as NextApiResponse; }),
    };
    return res as NextApiResponse & { _status: number; _json: unknown };
}

describe('rate-limit', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('allows requests under limit', async () => {
        const { checkRateLimit } = await import('../lib/server/rate-limit');
        const id = `test-user-${Date.now()}`;
        expect(checkRateLimit(id)).toBe(true);
        expect(checkRateLimit(id)).toBe(true);
        expect(checkRateLimit(id)).toBe(true);
    });

    it('blocks after exceeding limit', async () => {
        const { checkRateLimit } = await import('../lib/server/rate-limit');
        const id = `test-flood-${Date.now()}`;

        // Send 10 requests (limit)
        for (let i = 0; i < 10; i++) {
            expect(checkRateLimit(id)).toBe(true);
        }
        // 11th should be blocked
        expect(checkRateLimit(id)).toBe(false);
    });

    it('applyRateLimit returns 429 when blocked', async () => {
        const { checkRateLimit, applyRateLimit } = await import('../lib/server/rate-limit');
        const id = `test-429-${Date.now()}`;

        // Exhaust limit
        for (let i = 0; i < 10; i++) checkRateLimit(id);

        const res = createMockRes();
        const result = applyRateLimit(id, res);
        expect(result).toBe(false);
        expect(res._status).toBe(429);
    });

    it('different users have separate limits', async () => {
        const { checkRateLimit } = await import('../lib/server/rate-limit');
        const userA = `user-a-${Date.now()}`;
        const userB = `user-b-${Date.now()}`;

        // Exhaust userA
        for (let i = 0; i < 10; i++) checkRateLimit(userA);
        expect(checkRateLimit(userA)).toBe(false);

        // userB should still be allowed
        expect(checkRateLimit(userB)).toBe(true);
    });
});
