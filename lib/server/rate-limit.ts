import { NextApiResponse } from 'next';

const requestCounts = new Map<string, { count: number, resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute per IP or userID

export function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record) {
        requestCounts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
        return true; // Allowed
    }

    if (now > record.resetTime) {
        // Reset window
        requestCounts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
        return true; // Allowed
    }

    if (record.count >= MAX_REQUESTS) {
        return false; // Rate limited
    }

    record.count += 1;
    return true; // Allowed
}

export function applyRateLimit(identifier: string, res: NextApiResponse) {
    const isAllowed = checkRateLimit(identifier);
    if (!isAllowed) {
        res.status(429).json({ error: 'Too Many Requests', retryAfter: WINDOW_MS / 1000 });
        return false;
    }
    return true;
}
