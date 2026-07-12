import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Mock Supabase chained query builder ────────────────────
function createMockQueryBuilder(resolvedData: unknown = null, resolvedError: unknown = null) {
    const builder: Record<string, unknown> = {};
    const methods = ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'in', 'or', 'limit', 'order', 'single', 'maybeSingle'];
    for (const m of methods) {
        builder[m] = vi.fn(() => builder);
    }
    // Terminal methods that return data
    builder.single = vi.fn(() => Promise.resolve({ data: resolvedData, error: resolvedError }));
    builder.maybeSingle = vi.fn(() => Promise.resolve({ data: resolvedData, error: resolvedError }));
    // Non-terminal that can also resolve (for update/delete without single)
    builder.eq = vi.fn(() => ({ ...builder, eq: builder.eq, then: (resolve: (v: unknown) => void) => resolve({ data: resolvedData, error: resolvedError }) }));
    return builder;
}

// ─── Mock helpers ───────────────────────────────────────────
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
    const res: Partial<NextApiResponse> & { _status: number; _json: unknown; _ended: string } = {
        _status: 200,
        _json: null,
        _ended: '',
        status: vi.fn(function (this: typeof res, code: number) { this._status = code; return this as NextApiResponse; }),
        json: vi.fn(function (this: typeof res, data: unknown) { this._json = data; return this as NextApiResponse; }),
        end: vi.fn(function (this: typeof res, msg?: string) { this._ended = msg || ''; return this as NextApiResponse; }),
        setHeader: vi.fn(),
        redirect: vi.fn(),
    };
    return res as NextApiResponse & { _status: number; _json: unknown; _ended: string };
}

// ─── Test: toggle-read API ──────────────────────────────────

describe('API: toggle-read', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('rejects non-PATCH methods with 405', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn() }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/toggle-read');
        const req = createMockReq({ method: 'GET' });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('returns 401 when not authenticated', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue(null) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/toggle-read');
        const req = createMockReq({ method: 'PATCH', body: { id: '1', is_read: true } });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(401);
        expect(res._json).toEqual({ error: 'Unauthorized' });
    });

    it('returns 400 when id or is_read missing', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue({ id: 'u1' }) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/toggle-read');
        const req = createMockReq({ method: 'PATCH', body: { id: '1' } }); // missing is_read
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(400);
    });
});

// ─── Test: delete-link API ──────────────────────────────────

describe('API: delete-link', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('rejects non-DELETE methods with 405', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn() }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/delete-link');
        const req = createMockReq({ method: 'POST' });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('returns 401 when not authenticated', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue(null) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/delete-link');
        const req = createMockReq({ method: 'DELETE', query: { id: '1' } });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(401);
    });

    it('returns 400 when id is missing', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue({ id: 'u1' }) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/delete-link');
        const req = createMockReq({ method: 'DELETE', query: {} });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json).toEqual({ error: 'ID is required' });
    });
});

// ─── Test: check-duplicate API ──────────────────────────────

describe('API: check-duplicate', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('rejects non-GET methods with 405', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn() }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/check-duplicate');
        const req = createMockReq({ method: 'POST' });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('returns 401 when not authenticated', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue(null) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/check-duplicate');
        const req = createMockReq({ method: 'GET', query: { url: 'https://example.com' } });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(401);
    });

    it('returns 400 when url is missing', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue({ id: 'u1' }) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/check-duplicate');
        const req = createMockReq({ method: 'GET', query: {} });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json).toEqual({ error: 'URL is required' });
    });
});

// ─── Test: save-shared-content API ──────────────────────────

describe('API: save-shared-content', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('rejects unsupported methods with 405', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn() }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));
        vi.doMock('@/lib/platforms', () => ({ detectPlatform: vi.fn() }));

        const { default: handler } = await import('../pages/api/save-shared-content');
        const req = createMockReq({ method: 'PUT' });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('returns 400 when URL is missing (POST)', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn() }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));
        vi.doMock('@/lib/platforms', () => ({ detectPlatform: vi.fn() }));

        const { default: handler } = await import('../pages/api/save-shared-content');
        const req = createMockReq({ method: 'POST', body: { title: 'no url' } });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json).toEqual({ error: 'URL is required' });
    });

    it('returns 401 when not authenticated (POST)', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue(null) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));
        vi.doMock('@/lib/platforms', () => ({ detectPlatform: vi.fn() }));

        const { default: handler } = await import('../pages/api/save-shared-content');
        const req = createMockReq({ method: 'POST', body: { url: 'https://example.com' } });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(401);
    });

    it('does not call scraping or AI on fast path and returns linkId', async () => {
        const mockFetchOgMetadata = vi.fn();
        const mockClassifyCategory = vi.fn();
        const mockSummarizeContent = vi.fn();
        const mockExtractTags = vi.fn();
        const mockUploadImage = vi.fn();
        const mockCollectPlatformMetadata = vi.fn();

        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue({ id: 'user-1' }) }));
        vi.doMock('@/lib/platforms', () => ({ detectPlatform: vi.fn().mockReturnValue('web') }));
        vi.doMock('@/lib/server/scraper', () => ({ fetchOgMetadata: mockFetchOgMetadata }));
        vi.doMock('@/lib/server/storage', () => ({ uploadImageToStorage: mockUploadImage }));
        vi.doMock('@/lib/server/platform-metadata', () => ({ collectPlatformMetadata: mockCollectPlatformMetadata }));
        vi.doMock('@/lib/gemini', () => ({
            classifyCategory: mockClassifyCategory,
            summarizeContent: mockSummarizeContent,
            extractTags: mockExtractTags,
        }));

        const insertedRow = { id: 42 };
        const insertBuilder = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: insertedRow, error: null }),
        };
        const mockSupabase = { from: vi.fn().mockReturnValue(insertBuilder) };
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn().mockReturnValue(mockSupabase) }));

        const { default: handler } = await import('../pages/api/save-shared-content');
        const req = createMockReq({
            method: 'POST',
            body: { url: 'https://example.com', title: 'Example' },
            socket: { remoteAddress: '127.0.0.1' } as NextApiRequest['socket'],
        });
        const res = createMockRes();

        await handler(req, res);

        expect(res._status).toBe(200);
        expect(res._json).toEqual({ success: true, linkId: 42 });
        expect(mockFetchOgMetadata).not.toHaveBeenCalled();
        expect(mockClassifyCategory).not.toHaveBeenCalled();
        expect(mockSummarizeContent).not.toHaveBeenCalled();
        expect(mockExtractTags).not.toHaveBeenCalled();
        expect(mockUploadImage).not.toHaveBeenCalled();
        expect(mockCollectPlatformMetadata).not.toHaveBeenCalled();
    });
});

// ─── Test: update-link API ──────────────────────────────────

describe('API: update-link', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
    });

    it('rejects non-PATCH methods with 405', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn() }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/update-link');
        const req = createMockReq({ method: 'GET' });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('returns 400 when id is missing', async () => {
        vi.doMock('@/lib/auth', () => ({ getAuthUser: vi.fn().mockResolvedValue({ id: 'u1' }) }));
        vi.doMock('@/lib/supabase', () => ({ createSupabaseServerClient: vi.fn() }));

        const { default: handler } = await import('../pages/api/update-link');
        const req = createMockReq({ method: 'PATCH', body: { title: 'test' } });
        const res = createMockRes();

        await handler(req, res);
        expect(res._status).toBe(400);
        expect(res._json).toEqual({ error: 'ID is required' });
    });
});
