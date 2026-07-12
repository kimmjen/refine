-- RLS policies for link_metadata and link_images tables
-- These tables reference shared_links via link_id, so access should be scoped
-- through the parent link's user_id.

-- link_metadata RLS
ALTER TABLE link_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own link metadata" ON link_metadata
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_links
            WHERE shared_links.id = link_metadata.link_id
            AND shared_links.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own link metadata" ON link_metadata
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shared_links
            WHERE shared_links.id = link_metadata.link_id
            AND shared_links.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own link metadata" ON link_metadata
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM shared_links
            WHERE shared_links.id = link_metadata.link_id
            AND shared_links.user_id = auth.uid()
        )
    );

-- link_images RLS
ALTER TABLE link_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own link images" ON link_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shared_links
            WHERE shared_links.id = link_images.link_id
            AND shared_links.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own link images" ON link_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shared_links
            WHERE shared_links.id = link_images.link_id
            AND shared_links.user_id = auth.uid()
        )
    );
