import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * GET /api/admin/check
 * 현재 로그인한 유저가 admin인지 확인
 * Returns: { isAdmin: boolean }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const user = await getAuthUser(req);
    if (!user) {
        return res.status(200).json({ isAdmin: false });
    }

    const supabase = createSupabaseServerClient();

    // 1차: admin_users 테이블 확인 (DB 기반)
    const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

    if (!error) {
        return res.status(200).json({ isAdmin: !!data });
    }

    // fallback: admin_users 테이블이 없으면 user_metadata 확인
    // 마이그레이션 실행 후 이 fallback은 자동으로 무시됨
    const isMetadataAdmin = user.user_metadata?.role === 'admin';
    return res.status(200).json({ isAdmin: isMetadataAdmin });
}
