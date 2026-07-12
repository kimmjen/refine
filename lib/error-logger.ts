import { createSupabaseServerClient } from '@/lib/supabase';

type ErrorLevel = 'error' | 'warn' | 'info';
type ErrorSource = 'server' | 'client' | 'api';

interface LogErrorParams {
    level?: ErrorLevel;
    source?: ErrorSource;
    message: string;
    stack?: string | null;
    path?: string | null;
    userId?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Server-side error logger — writes to Supabase error_logs table.
 * When commercializing, replace with Sentry.captureException() or similar.
 */
export async function logError({
    level = 'error',
    source = 'server',
    message,
    stack,
    path,
    userId,
    metadata = {},
}: LogErrorParams): Promise<void> {
    try {
        const supabase = createSupabaseServerClient();
        await supabase.from('error_logs').insert({
            level,
            source,
            message,
            stack: stack || null,
            path: path || null,
            user_id: userId || null,
            metadata,
        });
    } catch (err) {
        // Fallback to console if DB logging fails
        console.error('[ErrorLogger] Failed to log error:', err);
        console.error('[ErrorLogger] Original error:', message);
    }
}

/**
 * Helper to log API route errors.
 */
export async function logApiError(
    error: unknown,
    path: string,
    userId?: string | null,
): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    await logError({
        level: 'error',
        source: 'api',
        message,
        stack,
        path,
        userId,
    });
}
