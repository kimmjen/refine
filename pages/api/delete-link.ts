import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { applyRateLimit } from '@/lib/server/rate-limit';
import { apiError } from '@/lib/api-response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!applyRateLimit(user.id, res)) return;

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    const supabaseAdmin = createSupabaseServerClient();

    // user_id도 함께 확인하여 본인 데이터만 삭제
    const { error } = await supabaseAdmin
      .from('shared_links')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    res.status(200).json({ success: true });
  } catch (error) {
    return apiError(res, 500, 'Failed to delete link', error, '/api/delete-link', user.id);
  }
}
