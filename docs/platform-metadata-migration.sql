-- =====================================================
-- Platform Enhancement Migration
-- 플랫폼별 메타데이터 저장을 위한 테이블 생성
-- =====================================================

-- 1. link_metadata 테이블 생성
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
  
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. link_images 테이블 생성 (이미지 저장용)
CREATE TABLE IF NOT EXISTS link_images (
  id BIGSERIAL PRIMARY KEY,
  link_id BIGINT REFERENCES shared_links(id) ON DELETE CASCADE,
  image_type TEXT CHECK (image_type IN ('og', 'thumbnail', 'avatar', 'content')),
  original_url TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security 활성화
ALTER TABLE link_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (user_id 기반 접근 제어)
CREATE POLICY "Users can view own link_metadata" ON link_metadata
  FOR SELECT USING (
    link_id IN (SELECT id FROM shared_links WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own link_metadata" ON link_metadata
  FOR INSERT WITH CHECK (
    link_id IN (SELECT id FROM shared_links WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own link_images" ON link_images
  FOR SELECT USING (
    link_id IN (SELECT id FROM shared_links WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own link_images" ON link_images
  FOR INSERT WITH CHECK (
    link_id IN (SELECT id FROM shared_links WHERE user_id = auth.uid())
  );

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_link_metadata_link_id ON link_metadata(link_id);
CREATE INDEX IF NOT EXISTS idx_link_images_link_id ON link_images(link_id);

-- =====================================================
-- 유용한 쿼리들
-- =====================================================

-- 메타데이터와 함께 링크 조회
-- SELECT sl.*, lm.*
-- FROM shared_links sl
-- LEFT JOIN link_metadata lm ON sl.id = lm.link_id
-- WHERE sl.id = 42;

-- GitHub 링크만 스타 순으로 정렬
-- SELECT sl.title, lm.github_stars, lm.github_forks
-- FROM shared_links sl
-- JOIN link_metadata lm ON sl.id = lm.link_id
-- WHERE sl.platform = 'GitHub' AND lm.github_stars IS NOT NULL
-- ORDER BY lm.github_stars DESC;

-- 플랫폼별 링크 개수
-- SELECT platform, COUNT(*) as count
-- FROM shared_links
-- GROUP BY platform
-- ORDER BY count DESC;
