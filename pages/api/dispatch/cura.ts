import { createSupabaseServerClient } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { getYoutubeInfo } from '@/lib/platforms/youtube';

const CURA_API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { linkId, collectionId } = req.body;

    if (!linkId || !collectionId) {
        return res.status(400).json({ error: 'linkId and collectionId are required' });
    }

    // 1. Get user and session
    const user = await getAuthUser(req);
    const authHeader = req.headers.authorization;

    if (!user || !authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const supabaseAdmin = createSupabaseServerClient();

        // 2. Fetch the link data
        const { data: link, error: linkError } = await supabaseAdmin
            .from('shared_links')
            .select('*')
            .eq('id', linkId)
            .eq('user_id', user.id)
            .single();

        if (linkError || !link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        // 3. Extract YouTube Info
        const { videoId } = getYoutubeInfo(link.url);
        if (!videoId) {
            return res.status(400).json({ error: 'Not a valid YouTube URL' });
        }

        // 4. Call CURA Backend
        const curaResponse = await fetch(`${CURA_API_BASE_URL}/api/collections/${collectionId}/videos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader, // Forward the Supabase JWT
            },
            body: JSON.stringify({
                youtubeVideoId: videoId,
                title: link.title || 'Untitled',
                channelName: 'Unknown', // Will be updated by CURA metadata sync if implemented
                thumbnailUrl: link.image_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                description: link.description || '',
                category: 'ETC', // Default
                publishedAt: new Date().toISOString(), // Default
            }),
        });

        if (!curaResponse.ok) {
            const errorData = await curaResponse.json();
            throw new Error(errorData.message || 'Failed to sync with CURA');
        }

        const curaData = await curaResponse.json();

        // 5. Update shared_links with dispatch info
        const { error: updateError } = await supabaseAdmin
            .from('shared_links')
            .update({
                dispatched_to: 'CURA',
                dispatched_at: new Date().toISOString(),
                target_id: curaData.id.toString(),
            })
            .eq('id', linkId);

        if (updateError) {
            console.warn('Sync successful but failed to update status:', updateError);
        }

        return res.status(200).json({
            success: true,
            curaId: curaData.id,
            message: 'Successfully dispatched to CURA'
        });

    } catch (error: unknown) {
        console.error('Dispatch Error:', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
}
