import { NextApiRequest, NextApiResponse } from 'next';
import { withAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { apiError } from '@/lib/api-response';

export default withAdmin(async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const supabase = createSupabaseServerClient();

        // 실제 데이터만 조회 — 목데이터 절대 사용하지 않음
        const [
            linksResult,
            usersResult,
            todayLinksResult,
            recentLinksResult,
        ] = await Promise.all([
            // 전체 링크 수
            supabase.from('shared_links').select('*', { count: 'exact', head: true }),
            // 실제 사용자 수 (auth.users — service role 필요)
            supabase.auth.admin.listUsers({ perPage: 1, page: 1 }),
            // 오늘 저장된 링크 수
            supabase.from('shared_links')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
            // 최근 링크 10개
            supabase.from('shared_links')
                .select('id, url, title, platform, created_at, user_id, category')
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        // 사용자 수: perPage=1로 요청하여 users 배열 최소화
        const usersData = usersResult.data as { users: unknown[]; total?: number } | undefined;
        const totalUsers = usersData?.total ?? usersData?.users?.length ?? 0;

        return res.status(200).json({
            metrics: {
                totalLinks: linksResult.count || 0,
                totalUsers,
                todayLinks: todayLinksResult.count || 0,
            },
            recentLinks: recentLinksResult.data || [],
        });

    } catch (error) {
        return apiError(res, 500, 'Failed to fetch admin statistics', error, '/api/admin/stats');
    }
});
