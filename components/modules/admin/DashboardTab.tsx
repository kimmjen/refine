import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link as LinkIcon, Users, Activity, Clock, Wrench, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AdminStats } from './types';
import { adminFetch } from './utils';
import { useTranslation } from 'next-i18next';

export function DashboardTab({ stats, loading, onRefresh }: { stats: AdminStats | null; loading: boolean; onRefresh: () => void }) {
    const { t } = useTranslation('common');
    const [backfilling, setBackfilling] = useState(false);
    const [backfillResult, setBackfillResult] = useState<{ total: number; updated: number; errors: number } | null>(null);

    async function handleAdminBackfill() {
        setBackfilling(true);
        setBackfillResult(null);
        try {
            const res = await adminFetch('/api/admin/backfill', { method: 'POST' });
            const json = await res.json();
            if (res.ok) setBackfillResult(json.data ?? json);
        } finally {
            setBackfilling(false);
        }
    }

    return (
        <div className="space-y-6">
            {!stats && loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard title={t('admin_total_links')} value={stats.metrics.totalLinks} icon={<LinkIcon className="h-4 w-4 text-primary" />} iconBg="bg-primary/10" sub={t('admin_across_all_users')} />
                        <MetricCard title={t('admin_total_users')} value={stats.metrics.totalUsers} icon={<Users className="h-4 w-4 text-blue-500" />} iconBg="bg-blue-500/10" sub={t('admin_registered_accounts')} />
                        <MetricCard title={t('admin_today')} value={stats.metrics.todayLinks} icon={<Clock className="h-4 w-4 text-green-500" />} iconBg="bg-green-500/10" sub={t('admin_links_today')} />
                    </div>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" /> {t('admin_recent_links')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-background text-muted-foreground text-xs uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">{t('title')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('sort_platform')}</th>
                                        <th className="px-4 py-3 font-semibold text-right">{t('admin_added')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {stats.recentLinks.map(link => (
                                        <tr key={link.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5 max-w-sm">
                                                    <span className="font-medium truncate">{link.title || link.url}</span>
                                                    <span className="text-xs text-muted-foreground truncate cursor-pointer hover:text-primary" onClick={() => window.open(link.url, '_blank')}>
                                                        {link.url.replace(/^https?:\/\//, '').slice(0, 50)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{link.platform || 'Web'}</Badge></td>
                                            <td className="px-4 py-3 text-right text-xs text-muted-foreground">{formatDate(link.created_at)}</td>
                                        </tr>
                                    ))}
                                    {stats.recentLinks.length === 0 && (
                                        <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">{t('admin_no_data')}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-primary" /> {t('admin_maintenance')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium">{t('admin_backfill_loginwall')}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{t('admin_backfill_loginwall_desc')}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleAdminBackfill} disabled={backfilling} className="shrink-0">
                                    {backfilling ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin_backfill_run')}
                                </Button>
                            </div>
                            {backfillResult && (
                                <p className="text-xs text-muted-foreground">
                                    {t('admin_backfill_result', { total: backfillResult.total, updated: backfillResult.updated, errors: backfillResult.errors })}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </>
            ) : null}
        </div>
    );
}

function MetricCard({ title, value, icon, iconBg, sub }: { title: string; value: number; icon: React.ReactNode; iconBg: string; sub: string }) {
    return (
        <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
                <div className={`h-8 w-8 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold tracking-tighter">{value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
        </Card>
    );
}
