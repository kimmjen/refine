import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { logError } from '@/lib/error-logger';

/**
 * Client-side error collection endpoint.
 * POST /api/error-log { message, stack, path, metadata }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message, stack, path, metadata } = req.body;

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'message is required' });
    }

    const user = await getAuthUser(req);

    await logError({
        level: 'error',
        source: 'client',
        message: message.slice(0, 1000),
        stack: typeof stack === 'string' ? stack.slice(0, 5000) : null,
        path: typeof path === 'string' ? path.slice(0, 500) : null,
        userId: user?.id || null,
        metadata: typeof metadata === 'object' ? metadata : {},
    });

    return res.status(200).json({ ok: true });
}
