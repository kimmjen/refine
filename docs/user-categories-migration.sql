-- =====================================================
-- User Categories Migration
-- 사용자별 커스텀 카테고리 테이블
-- =====================================================

-- 1. user_categories 테이블 생성
CREATE TABLE IF NOT EXISTS user_categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 2. Row Level Security 활성화
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 (사용자 본인만 접근)
CREATE POLICY "Users can view own categories" ON user_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories" ON user_categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories" ON user_categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories" ON user_categories
  FOR DELETE USING (user_id = auth.uid());

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_user_categories_user_sort 
  ON user_categories(user_id, sort_order);

-- =====================================================
-- 기본 카테고리 자동 생성 함수 (회원가입 시)
-- =====================================================

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
    (NEW.id, 'Career', 22);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 트리거 (auth.users INSERT 시 자동 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();

-- =====================================================
-- 기존 사용자 백필 (이미 가입한 사용자들에게 기본 카테고리 추가)
-- =====================================================

INSERT INTO public.user_categories (user_id, name, sort_order)
SELECT 
  u.id,
  cat.name,
  cat.sort_order
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('IT / Tech', 0), ('AI / GPT', 1), ('Business', 2), ('Finance', 3),
    ('News', 4), ('Design', 5), ('Marketing', 6), ('Bible / Faith', 7),
    ('Video', 8), ('Music', 9), ('Reading', 10), ('Study', 11),
    ('Health', 12), ('Travel', 13), ('Shopping', 14), ('Game', 15),
    ('Food', 16), ('Etc', 17), ('Sports', 18), ('Lifestyle', 19),
    ('Science', 20), ('Social', 21), ('Career', 22)
) AS cat(name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_categories uc 
  WHERE uc.user_id = u.id
)
ON CONFLICT (user_id, name) DO NOTHING;
