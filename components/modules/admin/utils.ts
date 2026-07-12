import { createSupabaseBrowserClient } from '@/lib/supabase';

export async function getToken() {
    const sb = createSupabaseBrowserClient();
    const { data: { session } } = await sb.auth.getSession();
    return session?.access_token || '';
}

export async function adminFetch(url: string, opts: RequestInit = {}) {
    const token = await getToken();
    return fetch(url, {
        ...opts,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
    });
}
