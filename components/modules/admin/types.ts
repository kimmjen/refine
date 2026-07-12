export interface AdminStats {
    metrics: { totalLinks: number; totalUsers: number; todayLinks: number };
    recentLinks: Array<{ id: number; url: string; title: string; platform: string; created_at: string; user_id: string; category: string }>;
}

export type TabId = 'dashboard' | 'links' | 'users' | 'ai_settings' | 'schema' | 'sql' | 'errors';
