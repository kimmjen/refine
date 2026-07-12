-- =============================================
-- Refine: Add user_id to shared_links
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add user_id column (nullable for existing data)
ALTER TABLE shared_links 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shared_links_user_id ON shared_links(user_id);

-- 3. Enable Row Level Security
ALTER TABLE shared_links ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any (safe to run multiple times)
DROP POLICY IF EXISTS "Users can view own links" ON shared_links;
DROP POLICY IF EXISTS "Users can insert own links" ON shared_links;
DROP POLICY IF EXISTS "Users can update own links" ON shared_links;
DROP POLICY IF EXISTS "Users can delete own links" ON shared_links;

-- 5. Create RLS Policies
-- SELECT: Users can only view their own links
CREATE POLICY "Users can view own links" ON shared_links
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can only insert links with their own user_id
CREATE POLICY "Users can insert own links" ON shared_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own links
CREATE POLICY "Users can update own links" ON shared_links
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own links
CREATE POLICY "Users can delete own links" ON shared_links
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- NOTE: After running this migration:
-- 1. Go to Authentication > Providers
-- 2. Enable Google provider
-- 3. Add your Google OAuth credentials
-- =============================================
