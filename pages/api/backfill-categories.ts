import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { fetchOgMetadata } from '@/lib/server/scraper';
import { classifyCategory, summarizeContent, extractTags } from '@/lib/gemini';
import { detectPlatform, isLoginWallTitle, instagramFallbackTitle } from '@/lib/platforms';
import { DEFAULT_AI_SETTINGS } from '@/types/db';

/**
 * 기존 링크 데이터 일괄 AI 보강 (Backfill)
 * - 카테고리 분류 + 요약 + 태그 추출
 * - 사용자 ai_settings 반영
 * POST /api/backfill-categories
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await getAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseServerClient();

    // 사용자 AI 설정 조회
    let settings = DEFAULT_AI_SETTINGS;
    const { data: userSettings } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
    if (userSettings) settings = userSettings;

    const aiEnabled = settings.ai_provider !== 'none';

    try {
        // 1. 보강이 필요한 링크 조회 (카테고리 없음 OR 제목 없음 OR 이미지 없음)
        const { data: links, error } = await supabase
            .from('shared_links')
            .select('id, url, title, description, category, image_url, platform')
            .eq('user_id', user.id)
            .or('category.eq.Uncategorized,category.is.null,title.eq.Untitled,title.is.null,image_url.is.null')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 2. 요약/태그가 없는 링크도 추가로 조회
        const { data: allLinks } = await supabase
            .from('shared_links')
            .select('id, url, title, description, category, image_url, platform')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        const { data: existingMetadata } = await supabase
            .from('link_metadata')
            .select('link_id, ai_summary, ai_tags');

        const metadataMap = new Map<number, { ai_summary: string | null; ai_tags: string[] | null }>();
        (existingMetadata || []).forEach(m => {
            metadataMap.set(m.link_id, { ai_summary: m.ai_summary, ai_tags: m.ai_tags });
        });

        // 보강 대상: 카테고리/��목/이미지 없음 OR 요약/태그 없음
        const needsBasicEnrich = new Set((links || []).map(l => l.id));
        const targetLinks = (allLinks || []).filter(link => {
            if (needsBasicEnrich.has(link.id)) return true;
            if (isLoginWallTitle(link.title)) return true;
            const meta = metadataMap.get(link.id);
            if (aiEnabled && settings.ai_auto_summary && (!meta?.ai_summary)) return true;
            if (aiEnabled && settings.ai_auto_tags && (!meta?.ai_tags || meta.ai_tags.length === 0)) return true;
            return false;
        });

        if (targetLinks.length === 0) {
            return res.status(200).json({ message: 'No links need updating', updated: 0, errors: 0, remaining: 0 });
        }

        const BATCH_SIZE = 8;
        const batch = targetLinks.slice(0, BATCH_SIZE);
        const remaining = Math.max(0, targetLinks.length - BATCH_SIZE);

        const lang = settings.preferred_language || 'en';
        let updatedCount = 0;
        let errorCount = 0;

        // 3. 배치 단위로 AI 보강 실행
        for (const link of batch) {
            try {
                const ogMeta = await fetchOgMetadata(link.url);
                const updateData: Record<string, unknown> = {};

                // 기본 메타데이터 보강
                if (!link.title || link.title === 'Untitled' || isLoginWallTitle(link.title)) {
                    const newTitle = ogMeta.title || instagramFallbackTitle(link.url) || (link.title === 'Untitled' ? undefined : link.title);
                    if (newTitle) updateData.title = newTitle;
                }
                if (!link.description && ogMeta.description) {
                    updateData.description = ogMeta.description;
                }
                if (!link.image_url && ogMeta.image) {
                    updateData.image_url = ogMeta.image;
                }
                if (!link.platform) {
                    updateData.platform = detectPlatform(link.url);
                }

                const title = (updateData.title as string) || link.title || '';
                const desc = (updateData.description as string) || link.description || '';

                // AI 카테고리 분류
                if (aiEnabled && settings.ai_auto_classify && (!link.category || link.category === 'Uncategorized')) {
                    updateData.category = await classifyCategory(link.url, title, desc);
                }

                // AI 요약 + 태그
                const meta = metadataMap.get(link.id);
                let aiSummary: string | null = meta?.ai_summary || null;
                let aiTags: string[] = meta?.ai_tags || [];

                const needsSummary = aiEnabled && settings.ai_auto_summary && !aiSummary;
                const needsTags = aiEnabled && settings.ai_auto_tags && (!aiTags || aiTags.length === 0);

                if (needsSummary || needsTags) {
                    const [summary, tags] = await Promise.all([
                        needsSummary ? summarizeContent(title, desc, lang) : Promise.resolve(null),
                        needsTags ? extractTags(title, desc, lang) : Promise.resolve([]),
                    ]);
                    if (summary) aiSummary = summary;
                    if (tags.length > 0) aiTags = tags;
                }

                // DB 업데이트 — shared_links
                if (Object.keys(updateData).length > 0) {
                    const { error: updateError } = await supabase
                        .from('shared_links')
                        .update(updateData)
                        .eq('id', link.id);
                    if (updateError) {
                        errorCount++;
                        continue;
                    }
                }

                // DB 업데이트 — link_metadata (요약/태그)
                if (aiSummary || aiTags.length > 0) {
                    const upsertData: Record<string, unknown> = { link_id: link.id };
                    if (aiSummary) upsertData.ai_summary = aiSummary;
                    if (aiTags.length > 0) upsertData.ai_tags = aiTags;

                    await supabase
                        .from('link_metadata')
                        .upsert(upsertData, { onConflict: 'link_id' });
                }

                updatedCount++;

                // Gemini 레이트리밋 방지 (500ms 딜레이)
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err: unknown) {
                console.error(`Error processing link ${link.id}:`, err);
                errorCount++;
            }
        }

        return res.status(200).json({
            message: remaining > 0 ? 'Batch complete' : 'Backfill complete',
            total: targetLinks.length,
            updated: updatedCount,
            errors: errorCount,
            remaining,
        });

    } catch (error: unknown) {
        console.error('Backfill error:', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
}
