-- Refine 전용 AI 설정 테이블 (기존 user_settings와 충돌 방지)
CREATE TABLE IF NOT EXISTS ai_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_provider TEXT NOT NULL DEFAULT 'none',
  gemini_api_key TEXT,
  openai_api_key TEXT,
  claude_api_key TEXT,
  ai_auto_classify BOOLEAN NOT NULL DEFAULT true,
  ai_auto_summary BOOLEAN NOT NULL DEFAULT true,
  ai_auto_tags BOOLEAN NOT NULL DEFAULT true,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS: 본인 설정만 접근 가능
CREATE POLICY "Users can view own ai_settings"
  ON ai_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_settings"
  ON ai_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_settings"
  ON ai_settings FOR UPDATE USING (auth.uid() = user_id);
