import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { DEFAULT_AI_SETTINGS } from '@/types/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await getAuthUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = createSupabaseServerClient();

    // GET — 현재 설정 조회 (API 키는 마스킹)
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('ai_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error || !data) {
            return res.status(200).json({ ...DEFAULT_AI_SETTINGS, user_id: user.id });
        }

        // API 키 마스킹 (앞 4자리만 보여주기)
        const maskKey = (key: string | null) => {
            if (!key) return null;
            return key.slice(0, 4) + '•'.repeat(Math.max(0, key.length - 4));
        };

        return res.status(200).json({
            ...data,
            gemini_api_key: maskKey(data.gemini_api_key),
            openai_api_key: maskKey(data.openai_api_key),
            claude_api_key: maskKey(data.claude_api_key),
            // 클라이언트에서 키 존재 여부 확인용
            _has_gemini_key: !!data.gemini_api_key,
            _has_openai_key: !!data.openai_api_key,
            _has_claude_key: !!data.claude_api_key,
        });
    }

    // PATCH — 설정 업데이트 (upsert)
    if (req.method === 'PATCH') {
        const allowedFields = [
            'ai_provider', 'ai_auto_classify', 'ai_auto_summary', 'ai_auto_tags',
            'preferred_language', 'gemini_api_key', 'openai_api_key', 'claude_api_key'
        ];
        const updates: Record<string, unknown> = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                // 마스킹된 키는 업데이트하지 않음 (• 포함 시 무시)
                if (field.endsWith('_api_key') && typeof req.body[field] === 'string' && req.body[field].includes('•')) {
                    continue;
                }
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await supabase
            .from('ai_settings')
            .upsert(
                { user_id: user.id, ...updates, updated_at: new Date().toISOString() },
                { onConflict: 'user_id' }
            )
            .select()
            .single();

        if (error) {
            console.error('Settings update error:', error);
            return res.status(500).json({ error: 'Failed to update settings' });
        }

        return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).end();
}
