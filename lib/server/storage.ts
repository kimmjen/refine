/**
 * 서버 전용 — Supabase Storage 이미지 업로드 서비스
 */
import { SupabaseClient } from '@supabase/supabase-js';

interface UploadResult {
    publicUrl?: string;
    path?: string;
    error?: unknown;
}

/**
 * 외부 이미지 URL을 다운로드하여 Supabase Storage에 업로드
 */
export async function uploadImageToStorage(
    supabase: SupabaseClient,
    imageUrl: string
): Promise<UploadResult> {
    try {
        const response = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`External image fetch failed: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (contentType.includes('webp')) ext = 'webp';

        const filename = `${crypto.randomUUID()}.${ext}`;
        const path = `og/${filename}`;

        const { error } = await supabase.storage
            .from('shared_links')
            .upload(path, buffer, { contentType, upsert: false });

        if (error) return { error };

        const { data: publicUrlData } = supabase.storage
            .from('shared_links')
            .getPublicUrl(path);

        return { publicUrl: publicUrlData.publicUrl, path };
    } catch (err) {
        return { error: err };
    }
}
