-- =====================================================
-- Refine: Initial base schema
-- 새 인스턴스(빈 DB)에서 001~009 마이그레이션이 동작하도록
-- 기존에 대시보드로 생성됐던 기본 테이블을 SQL로 복원한 것.
-- 모든 구문은 idempotent — 기존 설치에서 실행해도 무해함.
-- =====================================================

-- 1. shared_links: 메인 링크 저장소
--    (user_id / dispatch 컬럼은 001, 002에서 추가됨)
CREATE TABLE IF NOT EXISTS shared_links (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  platform TEXT,
  image_url TEXT,
  category TEXT,
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_shared_links_url ON shared_links(url);

-- 2. link_metadata: 플랫폼별 메타데이터 + AI 결과
CREATE TABLE IF NOT EXISTS link_metadata (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT REFERENCES shared_links(id) ON DELETE CASCADE UNIQUE,

  -- GitHub
  github_stars INT,
  github_forks INT,
  github_language TEXT,
  github_topics TEXT[],
  github_description TEXT,
  github_owner_avatar TEXT,

  -- Twitter/X (oEmbed)
  twitter_html TEXT,
  twitter_author TEXT,

  -- YouTube
  youtube_title TEXT,
  youtube_channel TEXT,
  youtube_thumbnail TEXT,
  youtube_duration TEXT,

  -- Instagram (oEmbed)
  instagram_html TEXT,
  instagram_author TEXT,

  -- Reddit
  reddit_title TEXT,
  reddit_subreddit TEXT,
  reddit_upvotes INT,
  reddit_comments INT,
  reddit_author TEXT,

  -- TikTok
  tiktok_title TEXT,
  tiktok_author TEXT,
  tiktok_thumbnail TEXT,

  -- Medium
  medium_title TEXT,
  medium_author TEXT,
  medium_reading_time INT,

  -- LinkedIn
  linkedin_title TEXT,
  linkedin_author TEXT,

  -- Threads
  threads_author TEXT,
  threads_html TEXT,

  -- AI 결과
  ai_summary TEXT,
  ai_tags TEXT[],

  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 문서 기반으로 부분 설치된 경우 AI 컬럼 보강
ALTER TABLE link_metadata ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE link_metadata ADD COLUMN IF NOT EXISTS ai_tags TEXT[];

CREATE INDEX IF NOT EXISTS idx_link_metadata_link_id ON link_metadata(link_id);

-- 3. link_images: 링크당 다중 이미지
CREATE TABLE IF NOT EXISTS link_images (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT REFERENCES shared_links(id) ON DELETE CASCADE,
  image_type TEXT CHECK (image_type IN ('og', 'thumbnail', 'avatar', 'content')),
  original_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_images_link_id ON link_images(link_id);

-- 4. user_categories: 사용자별 커스텀 카테고리
CREATE TABLE IF NOT EXISTS user_categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_categories_user_sort
  ON user_categories(user_id, sort_order);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON user_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON user_categories;

CREATE POLICY "Users can view own categories" ON user_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories" ON user_categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories" ON user_categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories" ON user_categories
  FOR DELETE USING (user_id = auth.uid());

-- 5. 회원가입 시 기본 카테고리 자동 생성
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_categories (user_id, name, sort_order)
  VALUES
    (NEW.id, 'IT / Tech', 0),
    (NEW.id, 'AI / GPT', 1),
    (NEW.id, 'Business', 2),
    (NEW.id, 'Finance', 3),
    (NEW.id, 'News', 4),
    (NEW.id, 'Design', 5),
    (NEW.id, 'Marketing', 6),
    (NEW.id, 'Bible / Faith', 7),
    (NEW.id, 'Video', 8),
    (NEW.id, 'Music', 9),
    (NEW.id, 'Reading', 10),
    (NEW.id, 'Study', 11),
    (NEW.id, 'Health', 12),
    (NEW.id, 'Travel', 13),
    (NEW.id, 'Shopping', 14),
    (NEW.id, 'Game', 15),
    (NEW.id, 'Food', 16),
    (NEW.id, 'Etc', 17),
    (NEW.id, 'Sports', 18),
    (NEW.id, 'Lifestyle', 19),
    (NEW.id, 'Science', 20),
    (NEW.id, 'Social', 21),
    (NEW.id, 'Career', 22)
  ON CONFLICT (user_id, name) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();
