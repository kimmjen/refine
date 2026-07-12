import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchOgMetadata } from '@/lib/server/scraper';
import { uploadImageToStorage } from '@/lib/server/storage';
import { collectPlatformMetadata } from '@/lib/server/platform-metadata';
import { classifyCategory, summarizeContent, extractTags } from '@/lib/gemini';
import { detectPlatform, instagramFallbackTitle } from '@/lib/platforms';
import { getAuthUser } from '@/lib/auth';
import { DEFAULT_AI_SETTINGS } from '@/types/db';
import { applyRateLimit } from '@/lib/server/rate-limit';

/**
 * 링크 보강 (Stage 2)
 * 스크래핑, 이미지 업로드, AI 분류/요약/태그, 플랫폼 메타데이터, link_images 처리.
 * 저장 직후 클라이언트가 비동기 호출하거나, 상세 페이지에서 수동 재호출 가능.
 * POST /api/enrich-link { linkId, url }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { linkId, url } = req.body;
    if (!linkId || !url) {
        return res.status(400).json({ error: 'linkId and url are required' });
    }

    const user = await getAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!applyRateLimit(user.id, res)) return;

    const supabase = createSupabaseServerClient();

    let settings = DEFAULT_AI_SETTINGS;
    const { data: userSettings } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
    if (userSettings) settings = userSettings;

    try {
        const ogMeta = await fetchOgMetadata(url);
        const platform = detectPlatform(url);

        const { data: existing } = await supabase
            .from('shared_links')
            .select('*')
            .eq('id', linkId)
            .eq('user_id', user.id)
            .single();

        if (!existing) {
            return res.status(404).json({ error: 'Link not found' });
        }

        const updateData: Record<string, unknown> = {};

        if (!existing.title || existing.title === 'Untitled') {
            updateData.title = ogMeta.title || instagramFallbackTitle(url) || existing.title;
        }
        if (!existing.description && ogMeta.description) {
            updateData.description = ogMeta.description;
        }
        if (!existing.platform) {
            updateData.platform = platform;
        }

        // OG 이미지 → Storage 업로드 (빈 경우만)
        let finalImageUrl: string | null = existing.image_url;
        let storagePath: string | null = null;
        if (!existing.image_url && ogMeta.image && ogMeta.image.startsWith('http')) {
            try {
                const { publicUrl, path, error: uploadError } = await uploadImageToStorage(supabase, ogMeta.image);
                if (!uploadError && publicUrl) {
                    finalImageUrl = publicUrl;
                    storagePath = path || null;
                    updateData.image_url = publicUrl;
                } else {
                    finalImageUrl = ogMeta.image;
                    updateData.image_url = ogMeta.image;
                }
            } catch (e) {
                console.warn('Image upload failed, falling back to original URL:', e);
                finalImageUrl = ogMeta.image;
                updateData.image_url = ogMeta.image;
            }
        }

        // AI 분류 + 요약 + 태그
        const title = (updateData.title as string) || existing.title || '';
        const desc = (updateData.description as string) || existing.description || '';
        const lang = settings.preferred_language || 'en';

        let category = existing.category;
        let aiSummary: string | null = null;
        let aiTags: string[] = [];

        if (settings.ai_provider !== 'none') {
            const results = await Promise.all([
                (settings.ai_auto_classify && (!existing.category || existing.category === 'Uncategorized'))
                    ? classifyCategory(url, title, desc)
                    : Promise.resolve(existing.category),
                settings.ai_auto_summary
                    ? summarizeContent(title, desc, lang)
                    : Promise.resolve(null),
                settings.ai_auto_tags
                    ? extractTags(title, desc, lang)
                    : Promise.resolve([]),
            ]);
            category = results[0];
            aiSummary = results[1];
            aiTags = results[2];
        }

        if (settings.ai_auto_classify && (!existing.category || existing.category === 'Uncategorized')) {
            updateData.category = category;
        }

        if (Object.keys(updateData).length > 0) {
            await supabase.from('shared_links').update(updateData).eq('id', linkId);
        }

        // 플랫폼 메타데이터 수집
        try {
            const platformMeta = await collectPlatformMetadata(platform, url);
            const metadataPayload: Record<string, unknown> = { link_id: linkId };
            if (platformMeta && Object.keys(platformMeta).length > 0) {
                Object.assign(metadataPayload, platformMeta);
            }
            if (aiSummary) metadataPayload.ai_summary = aiSummary;
            if (aiTags.length > 0) metadataPayload.ai_tags = aiTags;

            if (Object.keys(metadataPayload).length > 1) {
                await supabase
                    .from('link_metadata')
                    .upsert(metadataPayload, { onConflict: 'link_id' });
            }
        } catch (metaErr) {
            console.warn('Platform metadata failed:', metaErr);
        }

        // link_images 기록 (기존 row 없을 때만)
        const { count: existingImagesCount } = await supabase
            .from('link_images')
            .select('*', { count: 'exact', head: true })
            .eq('link_id', linkId);

        if (!existingImagesCount) {
            const imagesToInsert: Array<Record<string, unknown>> = [];
            const seenUrls = new Set<string>();

            if (ogMeta.image) {
                seenUrls.add(ogMeta.image);
                imagesToInsert.push({ link_id: linkId, image_type: 'og', original_url: ogMeta.image, storage_path: storagePath, created_at: new Date().toISOString() });
            }
            for (const imgUrl of ogMeta.images || []) {
                if (!seenUrls.has(imgUrl)) {
                    seenUrls.add(imgUrl);
                    imagesToInsert.push({ link_id: linkId, image_type: 'og', original_url: imgUrl, storage_path: null, created_at: new Date().toISOString() });
                }
            }
            for (const videoUrl of ogMeta.videos || []) {
                if (!seenUrls.has(videoUrl)) {
                    seenUrls.add(videoUrl);
                    imagesToInsert.push({ link_id: linkId, image_type: 'content', original_url: videoUrl, storage_path: null, created_at: new Date().toISOString() });
                }
            }

            if (imagesToInsert.length > 0) {
                const { error: imagesError } = await supabase.from('link_images').insert(imagesToInsert);
                if (imagesError) console.warn('Failed to save link images:', imagesError);
            }
        }

        return res.status(200).json({ success: true, category, aiSummary, aiTags, imageUrl: finalImageUrl });
    } catch (error: unknown) {
        console.error('Enrich error:', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
}
