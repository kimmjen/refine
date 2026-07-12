import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
    return {
        method: 'GET',
        headers: {},
        query: {},
        body: {},
        ...overrides,
    } as NextApiRequest;
}

function createMockRes() {
    const res: Partial<NextApiResponse> & { _status: number; _json: unknown } = {
        _status: 200,
        _json: null,
        status: vi.fn(function (this: typeof res, code: number) { this._status = code; return this as NextApiResponse; }),
        json: vi.fn(function (this: typeof res, data: unknown) { this._json = data; return this as NextApiResponse; }),
        end: vi.fn(),
        setHeader: vi.fn(),
    };
    return res as NextApiResponse & { _status: number; _json: unknown };
}

// ─── Test: getAuthUser ─────────────────────────────────────

describe('getAuthUser', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('returns null when no Authorization header', async () => {
        vi.doMock('@supabase/supabase-js', () => ({
            createClient: vi.fn(() => ({
                auth: { getUser: vi.fn() },
            })),
        }));

        const { getAuthUser } = await import('../lib/auth');
        const req = createMockReq({ headers: {} });
        const user = await getAuthUser(req);
        expect(user).toBeNull();
    });

    it('returns null when Authorization header is not Bearer', async () => {
        vi.doMock('@supabase/supabase-js', () => ({
            createClient: vi.fn(() => ({
                auth: { getUser: vi.fn() },
            })),
        }));

        const { getAuthUser } = await import('../lib/auth');
        const req = createMockReq({ headers: { authorization: 'Basic abc123' } });
        const user = await getAuthUser(req);
        expect(user).toBeNull();
    });

    it('returns null when token is invalid', async () => {
        vi.doMock('@supabase/supabase-js', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } }),
                },
            })),
        }));

        const { getAuthUser } = await import('../lib/auth');
        const req = createMockReq({ headers: { authorization: 'Bearer invalid-token' } });
        const user = await getAuthUser(req);
        expect(user).toBeNull();
    });

    it('returns user when token is valid', async () => {
        const mockUser = { id: 'user-123', email: 'test@test.com' };
        vi.doMock('@supabase/supabase-js', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            })),
        }));

        const { getAuthUser } = await import('../lib/auth');
        const req = createMockReq({ headers: { authorization: 'Bearer valid-token' } });
        const user = await getAuthUser(req);
        expect(user).toEqual(mockUser);
    });
});

// ─── Test: withAuth wrapper ────────────────────────────────

describe('withAuth', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('returns 401 when user is not authenticated', async () => {
        vi.doMock('@supabase/supabase-js', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'no user' } }),
                },
            })),
        }));

        const { withAuth } = await import('../lib/auth');
        const handler = vi.fn();
        const wrappedHandler = withAuth(handler);

        const req = createMockReq({ headers: {} });
        const res = createMockRes();

        await wrappedHandler(req, res);
        expect(res._status).toBe(401);
        expect(res._json).toEqual({ error: 'Unauthorized' });
        expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler with userId when authenticated', async () => {
        const mockUser = { id: 'user-456', email: 'test@test.com' };
        vi.doMock('@supabase/supabase-js', () => ({
            createClient: vi.fn(() => ({
                auth: {
                    getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
                },
            })),
        }));

        const { withAuth } = await import('../lib/auth');
        const handler = vi.fn();
        const wrappedHandler = withAuth(handler);

        const req = createMockReq({ headers: { authorization: 'Bearer valid-token' } });
        const res = createMockRes();

        await wrappedHandler(req, res);
        expect(handler).toHaveBeenCalledWith(req, res, 'user-456');
    });
});
