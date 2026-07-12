-- Performance indexes for common query patterns

-- shared_links: user_id + is_read (used by useLinks for read/unread filtering and count queries)
CREATE INDEX IF NOT EXISTS idx_shared_links_user_is_read ON shared_links(user_id, is_read);

-- shared_links: user_id + category (used for category filtering)
CREATE INDEX IF NOT EXISTS idx_shared_links_user_category ON shared_links(user_id, category);

-- shared_links: user_id + created_at (used for sorting by date)
CREATE INDEX IF NOT EXISTS idx_shared_links_user_created_at ON shared_links(user_id, created_at DESC);
