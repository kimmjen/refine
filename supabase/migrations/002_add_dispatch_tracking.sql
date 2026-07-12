-- =============================================
-- Refine: Add dispatch tracking to shared_links
-- =============================================

-- Add columns to track where and when a link was dispatched
ALTER TABLE shared_links 
ADD COLUMN IF NOT EXISTS dispatched_to TEXT,
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS target_id TEXT;

-- Index for target_id to allow quick reverse lookups
CREATE INDEX IF NOT EXISTS idx_shared_links_target_id ON shared_links(target_id);

-- Commentary:
-- dispatched_to: 'CURA', 'MY_STANDARD_DOC' or NULL
-- target_id: The ID of the record in the target system (e.g., youtube_video_id or doc slug)
