import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUrlVariants } from '@/lib/url';
import { getAuthUser } from '@/lib/auth';

interface DuplicateResponse {
  isDuplicate: boolean;
  existingLink?: {
    id: number;
    title: string;
    created_at: string;
    category: string | null;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DuplicateResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // 인증 확인
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const supabase = createSupabaseServerClient();

    // URL 변형들 생성 (www 유무, http/https 차이 커버)
    const urlVariants = getUrlVariants(url);

    // DB에서 직접 검색 (user_id 필터 추가)
    const { data: duplicate, error } = await supabase
      .from('shared_links')
      .select('id, title, created_at, category')
      .eq('user_id', user.id)
      .in('url', urlVariants)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (duplicate) {
      return res.status(200).json({
        isDuplicate: true,
        existingLink: {
          id: duplicate.id,
          title: duplicate.title,
          created_at: duplicate.created_at,
          category: duplicate.category,
        },
      });
    }

    return res.status(200).json({ isDuplicate: false });
  } catch (error) {
    console.error('Check Duplicate Error:', error);
    return res.status(500).json({ error: 'Error checking duplicate' });
  }
}
