-- Error logs table for application error tracking
CREATE TABLE IF NOT EXISTS error_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    level text NOT NULL DEFAULT 'error',        -- 'error', 'warn', 'info'
    source text NOT NULL DEFAULT 'server',       -- 'server', 'client', 'api'
    message text NOT NULL,
    stack text,
    path text,                                    -- URL path where error occurred
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}'::jsonb            -- extra context (user agent, etc.)
);

-- Index for querying recent errors
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_level ON error_logs(level);

-- RLS: only service role can insert/read (no client access)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
