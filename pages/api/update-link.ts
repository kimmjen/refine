import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/server/rate-limit';
import { apiError } from '@/lib/api-response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!applyRateLimit(user.id, res)) return;

  const { id, ...rawData } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  // 허용 필드만 추출 (user_id 등 민감 필드 주입 방지)
  const ALLOWED_FIELDS = ['title', 'description', 'category', 'url', 'is_read', 'image_url', 'platform'];
  const updateData = Object.fromEntries(
    Object.entries(rawData).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const supabaseAdmin = createSupabaseServerClient();

    const { error } = await supabaseAdmin
      .from('shared_links')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    return apiError(res, 500, 'Failed to update link', error, '/api/update-link', user.id);
  }
}
