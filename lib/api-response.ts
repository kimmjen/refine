import { NextApiResponse } from 'next';
import { logApiError } from '@/lib/error-logger';

/**
 * Standardized API error response.
 * Logs the error to error_logs table and returns consistent JSON format.
 */
export async function apiError(
    res: NextApiResponse,
    status: number,
    message: string,
    error?: unknown,
    path?: string,
    userId?: string | null,
): Promise<void> {
    if (error && status >= 500) {
        await logApiError(error, path || 'unknown', userId).catch(() => {});
    }
    res.status(status).json({ error: message });
}

/**
 * Standardized API success response.
 */
export function apiSuccess(res: NextApiResponse, data: Record<string, unknown> = {}): void {
    res.status(200).json({ success: true, ...data });
}
