import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = createSupabaseServerClient();

  try {
    const [linkResult, imagesResult] = await Promise.all([
      supabase
        .from('shared_links')
        .select('*, link_metadata(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('link_images')
        .select('*')
        .eq('link_id', id)
        .order('id', { ascending: true })
    ]);

    if (linkResult.error) throw linkResult.error;

    const { data } = linkResult;
    const { data: imageRows } = imagesResult;

    const images: string[] = (imageRows || []).map(img => {
      if (img.storage_path) {
        const { data: { publicUrl } } = supabase.storage
          .from('shared_links')
          .getPublicUrl(img.storage_path);
        return publicUrl;
      }
      return img.original_url;
    }).filter(Boolean);

    const { link_metadata, ...linkData } = data;

    res.setHeader('Cache-Control', 'private, s-maxage=60, stale-while-revalidate=30');

    return res.status(200).json({
      link: linkData,
      metadata: link_metadata || null,
      images
    });
  } catch (err) {
    console.error(err);
    return res.status(404).json({ error: 'Link not found' });
  }
}
