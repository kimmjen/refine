import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import { applyRateLimit } from '@/lib/server/rate-limit';
import { apiError } from '@/lib/api-response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createSupabaseServerClient();
    const user = await getAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;

    // Rate limit for mutable operations only
    if (req.method !== 'GET' && !applyRateLimit(userId, res)) return;

    switch (req.method) {
        // 카테고리 목록 조회
        case 'GET': {
            try {
                const { data, error } = await supabase
                    .from('user_categories')
                    .select('id, name, sort_order')
                    .eq('user_id', userId)
                    .order('sort_order', { ascending: true });

                if (error) throw error;

                // 카테고리가 없으면 기본값 생성
                if (!data || data.length === 0) {
                    const defaultData = DEFAULT_CATEGORIES.map((name, index) => ({
                        user_id: userId,
                        name,
                        sort_order: index,
                    }));

                    const { data: inserted, error: insertError } = await supabase
                        .from('user_categories')
                        .insert(defaultData)
                        .select('id, name, sort_order');

                    if (insertError) throw insertError;
                    return res.status(200).json({ categories: inserted });
                }

                return res.status(200).json({ categories: data });
            } catch (error) {
                return apiError(res, 500, 'Failed to fetch categories', error, '/api/categories', userId);
            }
        }

        // 카테고리 추가
        case 'POST': {
            try {
                const { name } = req.body;
                if (!name || typeof name !== 'string') {
                    return res.status(400).json({ error: 'Category name is required' });
                }

                // 현재 최대 sort_order 조회
                const { data: maxOrder } = await supabase
                    .from('user_categories')
                    .select('sort_order')
                    .eq('user_id', userId)
                    .order('sort_order', { ascending: false })
                    .limit(1)
                    .single();

                const newSortOrder = (maxOrder?.sort_order ?? -1) + 1;

                const { data, error } = await supabase
                    .from('user_categories')
                    .insert({ user_id: userId, name: name.trim(), sort_order: newSortOrder })
                    .select('id, name, sort_order')
                    .single();

                if (error) {
                    if (error.code === '23505') { // unique violation
                        return res.status(409).json({ error: 'Category already exists' });
                    }
                    throw error;
                }

                return res.status(201).json({ category: data });
            } catch (error) {
                return apiError(res, 500, 'Failed to create category', error, '/api/categories', userId);
            }
        }

        // 카테고리 삭제
        case 'DELETE': {
            try {
                const { id } = req.query;
                if (!id) {
                    return res.status(400).json({ error: 'Category ID is required' });
                }

                // 해당 카테고리 사용 중인 링크 → Etc로 변경
                await supabase
                    .from('shared_links')
                    .update({ category: 'Etc' })
                    .eq('user_id', userId)
                    .eq('category', (
                        await supabase
                            .from('user_categories')
                            .select('name')
                            .eq('id', id)
                            .single()
                    ).data?.name);

                const { error } = await supabase
                    .from('user_categories')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);

                if (error) throw error;

                return res.status(200).json({ success: true });
            } catch (error) {
                return apiError(res, 500, 'Failed to delete category', error, '/api/categories', userId);
            }
        }

        // 순서 변경
        case 'PATCH': {
            try {
                const { orders } = req.body;
                if (!orders || !Array.isArray(orders)) {
                    return res.status(400).json({ error: 'Orders array is required' });
                }

                // 각 카테고리 순서 업데이트
                for (const { id, sort_order } of orders) {
                    await supabase
                        .from('user_categories')
                        .update({ sort_order })
                        .eq('id', id)
                        .eq('user_id', userId);
                }

                return res.status(200).json({ success: true });
            } catch (error) {
                return apiError(res, 500, 'Failed to update order', error, '/api/categories', userId);
            }
        }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
