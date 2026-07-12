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

describe('apiError', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('returns correct status and error message', async () => {
        vi.doMock('@/lib/error-logger', () => ({
            logApiError: vi.fn().mockResolvedValue(undefined),
        }));

        const { apiError } = await import('../lib/api-response');
        const res = createMockRes();

        await apiError(res, 400, 'Bad request');
        expect(res._status).toBe(400);
        expect(res._json).toEqual({ error: 'Bad request' });
    });

    it('logs error for 500+ status codes', async () => {
        const mockLogApiError = vi.fn().mockResolvedValue(undefined);
        vi.doMock('@/lib/error-logger', () => ({
            logApiError: mockLogApiError,
        }));

        const { apiError } = await import('../lib/api-response');
        const res = createMockRes();
        const testError = new Error('DB connection failed');

        await apiError(res, 500, 'Internal error', testError, '/api/test', 'user-1');
        expect(res._status).toBe(500);
        expect(mockLogApiError).toHaveBeenCalledWith(testError, '/api/test', 'user-1');
    });

    it('does not log error for 4xx status codes', async () => {
        const mockLogApiError = vi.fn().mockResolvedValue(undefined);
        vi.doMock('@/lib/error-logger', () => ({
            logApiError: mockLogApiError,
        }));

        const { apiError } = await import('../lib/api-response');
        const res = createMockRes();

        await apiError(res, 404, 'Not found', new Error('missing'));
        expect(mockLogApiError).not.toHaveBeenCalled();
    });
});

describe('apiSuccess', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('returns 200 with success true', async () => {
        vi.doMock('@/lib/error-logger', () => ({
            logApiError: vi.fn(),
        }));

        const { apiSuccess } = await import('../lib/api-response');
        const res = createMockRes();

        apiSuccess(res);
        expect(res._status).toBe(200);
        expect(res._json).toEqual({ success: true });
    });

    it('merges additional data', async () => {
        vi.doMock('@/lib/error-logger', () => ({
            logApiError: vi.fn(),
        }));

        const { apiSuccess } = await import('../lib/api-response');
        const res = createMockRes();

        apiSuccess(res, { count: 5, items: ['a', 'b'] });
        expect(res._json).toEqual({ success: true, count: 5, items: ['a', 'b'] });
    });
});
