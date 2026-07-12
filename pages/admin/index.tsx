import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LayoutShell from '@/components/layout/LayoutShell';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck, Activity, Users, Settings, Database, Server, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
    props: {
        ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
    },
});
import { AdminStats, TabId } from '@/components/modules/admin/types';
import { adminFetch } from '@/components/modules/admin/utils';

// Import refactored tab components
import { DashboardTab } from '@/components/modules/admin/DashboardTab';
import { DataTableTab } from '@/components/modules/admin/DataTableTab';
import { UsersTab } from '@/components/modules/admin/UsersTab';
import { SchemaTab } from '@/components/modules/admin/SchemaTab';
import { SqlConsoleTab } from '@/components/modules/admin/SqlConsoleTab';
import { ErrorLogsTab } from '@/components/modules/admin/ErrorLogsTab';

export default function AdminDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const { t } = useTranslation('common');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [adminChecked, setAdminChecked] = useState(false);

    // DB 기반 admin 권한 확인
    useEffect(() => {
        if (authLoading || !user) return;
        (async () => {
            try {
                const res = await adminFetch('/api/admin/check');
                const json = await res.json();
                setIsSuperAdmin(json.isAdmin === true);
            } catch {
                setIsSuperAdmin(false);
            } finally {
                setAdminChecked(true);
            }
        })();
    }, [user, authLoading]);

    useEffect(() => {
        if (!authLoading && adminChecked && (!user || !isSuperAdmin)) {
            router.replace('/');
        }
    }, [user, isSuperAdmin, authLoading, adminChecked, router]);

    const fetchStats = useCallback(async () => {
        if (!isSuperAdmin) return;
        setStatsLoading(true);
        try {
            const res = await adminFetch('/api/admin/stats');
            if (res.ok) {
                const json = await res.json();
                setStats(json.data);
            }
        } catch { /* ignore */ } finally {
            setStatsLoading(false);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (isSuperAdmin && activeTab === 'dashboard' && !stats) {
            fetchStats();
        }
    }, [isSuperAdmin, activeTab, stats, fetchStats]);

    if (authLoading || !adminChecked) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    if (!user || !isSuperAdmin) return null;

    const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: 'dashboard', label: t('admin_tab_overview'), icon: <Activity className="h-4 w-4" /> },
        { id: 'links', label: t('admin_tab_links'), icon: <Database className="h-4 w-4" /> },
        { id: 'users', label: t('admin_tab_users'), icon: <Users className="h-4 w-4" /> },
        { id: 'ai_settings', label: t('admin_tab_ai_settings'), icon: <Settings className="h-4 w-4" /> },
        { id: 'schema', label: t('admin_tab_schema'), icon: <Server className="h-4 w-4" /> },
        { id: 'sql', label: t('admin_tab_sql'), icon: <Database className="h-4 w-4" /> },
        { id: 'errors', label: t('admin_tab_errors'), icon: <AlertCircle className="h-4 w-4" /> },
    ];

    return (
        <LayoutShell>
            <Head>
                <title>{t('admin_title')} | Refine</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-primary" /> {t('admin_title')}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">{t('admin_desc')}</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Navigation Sidebar */}
                    <aside className="lg:w-64 shrink-0">
                        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-x-auto pb-2 lg:pb-0 sticky top-24">
                            {TABS.map(tab => (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? "default" : "ghost"}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "justify-start gap-3 px-4 py-2.5 text-sm font-medium whitespace-nowrap",
                                        activeTab === tab.id ? "shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab.icon} {tab.label}
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                            {activeTab === 'dashboard' && <DashboardTab stats={stats} loading={statsLoading} onRefresh={fetchStats} />}

                            {activeTab === 'links' && (
                                <div className="space-y-6">
                                    <DataTableTab
                                        tableName="shared_links"
                                        searchable
                                        columns={[
                                            { key: 'id', label: t('admin_id'), width: '80px' },
                                            { key: 'url', label: t('admin_url'), editable: true },
                                            { key: 'title', label: t('title'), editable: true },
                                            { key: 'category', label: t('sort_category'), editable: true },
                                            { key: 'platform', label: t('sort_platform'), editable: true },
                                            { key: 'created_at', label: t('admin_added'), width: '120px' }
                                        ]}
                                    />
                                    <DataTableTab
                                        tableName="link_metadata"
                                        columns={[
                                            { key: 'id', label: t('admin_id'), width: '80px' },
                                            { key: 'link_id', label: t('admin_link_id'), width: '80px' },
                                            { key: 'title', label: t('title'), editable: true },
                                            { key: 'description', label: t('admin_description'), editable: true },
                                            { key: 'site_name', label: t('admin_site'), editable: true }
                                        ]}
                                    />
                                </div>
                            )}

                            {activeTab === 'users' && <UsersTab />}

                            {activeTab === 'ai_settings' && (
                                <DataTableTab
                                    tableName="ai_settings"
                                    columns={[
                                        { key: 'id', label: t('admin_id'), width: '60px' },
                                        { key: 'user_id', label: t('admin_user_id'), width: '250px' },
                                        { key: 'ai_provider', label: t('admin_provider'), editable: true },
                                        { key: 'preferred_language', label: t('admin_lang'), editable: true },
                                        { key: 'ai_auto_classify', label: t('admin_auto_classify'), editable: true },
                                        { key: 'ai_auto_summary', label: t('admin_auto_summary'), editable: true },
                                        { key: 'updated_at', label: t('admin_updated') }
                                    ]}
                                />
                            )}

                            {activeTab === 'schema' && <SchemaTab />}
                            {activeTab === 'sql' && <SqlConsoleTab />}
                            {activeTab === 'errors' && <ErrorLogsTab />}
                        </div>
                    </main>
                </div>
            </div>
        </LayoutShell>
    );
}
