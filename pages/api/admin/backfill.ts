import { NextApiRequest, NextApiResponse } from 'next';
import { withAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { apiError } from '@/lib/api-response';
import { isLoginWallTitle, instagramFallbackTitle } from '@/lib/platforms';

export default withAdmin(async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = createSupabaseServerClient();

        // 전체 유저의 로그인 월 타이틀 링크 조회 (RLS 없이 service role로)
        const { data: links, error } = await supabase
            .from('shared_links')
            .select('id, url, title')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const targets = (links || []).filter(l => isLoginWallTitle(l.title));

        if (targets.length === 0) {
            return res.status(200).json({ message: 'No login-wall titles found', total: 0, updated: 0, errors: 0 });
        }

        let updated = 0;
        let errors = 0;

        for (const link of targets) {
            const newTitle = instagramFallbackTitle(link.url);
            if (!newTitle) {
                errors++;
                continue;
            }
            const { error: updateError } = await supabase
                .from('shared_links')
                .update({ title: newTitle })
                .eq('id', link.id);
            if (updateError) {
                errors++;
            } else {
                updated++;
            }
        }

        return res.status(200).json({ message: 'Admin backfill complete', total: targets.length, updated, errors });
    } catch (error) {
        return apiError(res, 500, 'Admin backfill failed', error, '/api/admin/backfill');
    }
});
