import type { NextApiRequest, NextApiResponse } from 'next';
import { detectPlatform } from '@/lib/platforms';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { applyRateLimit } from '@/lib/server/rate-limit';

/**
 * 빠른 저장 (Stage 1)
 * URL + 플랫폼 감지 + DB insert만 수행. 스크래핑/AI는 클라이언트가 /api/enrich-link로 비동기 처리.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { url, title, description, category } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const identifier = user.id || req.socket.remoteAddress || 'unknown';
  if (!applyRateLimit(identifier, res)) return;

  try {
    const supabase = createSupabaseServerClient();
    const platformName = detectPlatform(url);

    const { data: insertedLink, error } = await supabase
      .from('shared_links')
      .insert([{
        url,
        title: title || 'Untitled',
        description: description || '',
        platform: platformName,
        category: category || 'Uncategorized',
        user_id: user.id,
        created_at: new Date().toISOString(),
      }])
      .select('id')
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, linkId: insertedLink?.id });
  } catch (error) {
    console.error('Save Handler Error:', error);
    return res.status(500).json({ error: 'Failed to save' });
  }
}
