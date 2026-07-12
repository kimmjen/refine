import { NextApiRequest, NextApiResponse } from 'next';
import { withAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

const ALLOWED_TABLES = ['shared_links', 'link_metadata', 'link_images', 'user_categories', 'ai_settings', 'error_logs'];

const ALLOWED_SORT_FIELDS: Record<string, string[]> = {
    shared_links: ['id', 'created_at', 'title', 'url', 'category', 'platform', 'is_read', 'user_id'],
    link_metadata: ['id', 'link_id', 'title', 'site_name'],
    link_images: ['id', 'link_id'],
    user_categories: ['id', 'sort_order', 'name', 'user_id'],
    ai_settings: ['updated_at', 'user_id', 'ai_provider', 'preferred_language'],
    error_logs: ['id', 'created_at', 'level', 'source', 'message'],
};

export default withAdmin(async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createSupabaseServerClient();
    const { table } = req.query;

    if (!table || typeof table !== 'string' || !ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ error: `Invalid table. Allowed: ${ALLOWED_TABLES.join(', ')}` });
    }

    try {
        switch (req.method) {
            case 'GET': {
                const page = parseInt(req.query.page as string) || 1;
                const pageSize = parseInt(req.query.pageSize as string) || 20;
                const search = req.query.search as string;
                const defaultSort = table === 'ai_settings' ? 'updated_at' : 'id';
                const rawSortBy = (req.query.sortBy as string) || defaultSort;
                const allowedFields = ALLOWED_SORT_FIELDS[table] || ['id'];
                const sortBy = allowedFields.includes(rawSortBy) ? rawSortBy : defaultSort;
                const sortOrder = (req.query.sortOrder as string) === 'asc';
                const offset = (page - 1) * pageSize;

                let query = supabase.from(table).select('*', { count: 'exact' });

                if (search && search.length > 100) {
                    return res.status(400).json({ error: 'Search term too long' });
                }
                if (search && table === 'shared_links') {
                    query = query.or(`url.ilike.%${search}%,title.ilike.%${search}%`);
                }

                query = query.order(sortBy, { ascending: sortOrder })
                    .range(offset, offset + pageSize - 1);

                const { data, count, error } = await query;
                if (error) throw error;

                return res.status(200).json({
                    data: data || [],
                    total: count || 0,
                    page,
                    pageSize,
                    totalPages: Math.ceil((count || 0) / pageSize),
                });
            }

            case 'PUT': {
                const { id, updates } = req.body;
                if (!id || !updates) {
                    return res.status(400).json({ error: 'id and updates required' });
                }

                // ai_settings는 user_id가 PK
                const pkField = table === 'ai_settings' ? 'user_id' : 'id';
                const { data, error } = await supabase
                    .from(table)
                    .update(updates)
                    .eq(pkField, id)
                    .select()
                    .single();

                if (error) throw error;
                return res.status(200).json({ data });
            }

            case 'DELETE': {
                const { id: deleteId } = req.body;
                if (!deleteId) {
                    return res.status(400).json({ error: 'id required' });
                }

                const pkField = table === 'ai_settings' ? 'user_id' : 'id';
                const { error } = await supabase
                    .from(table)
                    .delete()
                    .eq(pkField, deleteId);

                if (error) throw error;
                return res.status(200).json({ success: true });
            }

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: unknown) {
        console.error(`Admin DB [${table}] error:`, error);
        return res.status(500).json({ error: 'Database operation failed' });
    }
});
