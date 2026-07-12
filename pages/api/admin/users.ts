import { NextApiRequest, NextApiResponse } from 'next';
import { withAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export default withAdmin(async function handler(req: NextApiRequest, res: NextApiResponse, adminUserId: string) {
    const supabase = createSupabaseServerClient();

    try {
        switch (req.method) {
            case 'GET': {
                const page = parseInt(req.query.page as string) || 1;
                const perPage = parseInt(req.query.pageSize as string) || 20;

                const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
                if (error) throw error;

                // admin_users 테이블에서 admin 목록 조회
                const { data: adminList } = await supabase
                    .from('admin_users')
                    .select('user_id');
                const adminIds = new Set((adminList || []).map(a => a.user_id));

                const users = (data?.users || []).map(u => ({
                    id: u.id,
                    email: u.email,
                    full_name: u.user_metadata?.full_name || u.user_metadata?.name || '-',
                    avatar_url: u.user_metadata?.avatar_url || null,
                    role: adminIds.has(u.id) ? 'admin' : 'user',
                    provider: u.app_metadata?.provider || 'email',
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at,
                }));

                return res.status(200).json({
                    data: users,
                    total: users.length,
                    page,
                });
            }

            case 'PUT': {
                const { id, updates } = req.body;
                if (!id) return res.status(400).json({ error: 'User id required' });

                if (updates.role !== undefined) {
                    if (updates.role === 'admin') {
                        // admin_users 테이블에 추가
                        const { error } = await supabase
                            .from('admin_users')
                            .upsert({ user_id: id, granted_by: adminUserId });
                        if (error) throw error;
                    } else {
                        // admin_users 테이블에서 제거
                        const { error } = await supabase
                            .from('admin_users')
                            .delete()
                            .eq('user_id', id);
                        if (error) throw error;
                    }
                }

                return res.status(200).json({
                    data: { id, role: updates.role || 'user' }
                });
            }

            case 'DELETE': {
                const { id } = req.body;
                if (!id) return res.status(400).json({ error: 'User id required' });

                // admin_users에서도 제거 (CASCADE로 자동이지만 명시적으로)
                await supabase.from('admin_users').delete().eq('user_id', id);

                const { error } = await supabase.auth.admin.deleteUser(id);
                if (error) throw error;

                return res.status(200).json({ success: true });
            }

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Admin Users API error:', error);
        return res.status(500).json({ error: error.message || 'Failed' });
    }
});
