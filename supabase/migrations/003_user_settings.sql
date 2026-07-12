-- Create user_settings table for AI provider preferences
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_provider TEXT NOT NULL DEFAULT 'gemini',
  ai_auto_classify BOOLEAN NOT NULL DEFAULT true,
  ai_auto_summary BOOLEAN NOT NULL DEFAULT true,
  ai_auto_tags BOOLEAN NOT NULL DEFAULT true,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can read all (for API routes)
CREATE POLICY "Service role can read all settings"
  ON user_settings FOR SELECT
  USING (auth.role() = 'service_role');
