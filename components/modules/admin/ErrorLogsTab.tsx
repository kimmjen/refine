import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCcw, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { adminFetch } from './utils';
import { useTranslation } from 'next-i18next';

interface ErrorLog {
    id: number;
    created_at: string;
    level: string;
    source: string;
    message: string;
    stack: string | null;
    path: string | null;
    user_id: string | null;
    metadata: Record<string, unknown>;
}

export function ErrorLogsTab() {
    const { t } = useTranslation('common');
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch('/api/admin/db?table=error_logs&pageSize=50&sortBy=created_at&sortOrder=desc');
            if (res.ok) {
                const json = await res.json();
                setLogs(json.data || []);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const clearLogs = async () => {
        if (!confirm('Clear all error logs?')) return;
        try {
            const res = await adminFetch('/api/admin/sql', {
                method: 'POST',
                body: JSON.stringify({ query: 'DELETE FROM error_logs' }),
            });
            if (res.ok) fetchLogs();
        } catch { /* ignore */ }
    };

    const levelColors: Record<string, string> = {
        error: 'bg-destructive/10 text-destructive border-destructive/20',
        warn: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        info: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    };

    const sourceColors: Record<string, string> = {
        server: 'bg-purple-500/10 text-purple-600',
        client: 'bg-blue-500/10 text-blue-600',
        api: 'bg-green-500/10 text-green-600',
    };

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" /> Error Logs
                        </CardTitle>
                        <CardDescription className="mt-1">{logs.length} entries</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={clearLogs} disabled={loading || logs.length === 0} className="gap-1.5 h-9 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" /> Clear
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1.5 h-9">
                            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('admin_refresh')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading && logs.length === 0 ? (
                    <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : logs.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">No errors logged</div>
                ) : (
                    <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                        {logs.map(log => (
                            <div
                                key={log.id}
                                className="px-4 py-3 hover:bg-muted/20 cursor-pointer transition-colors"
                                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex gap-1.5 shrink-0 pt-0.5">
                                        <Badge variant="outline" className={`text-[9px] px-1.5 ${levelColors[log.level] || ''}`}>
                                            {log.level}
                                        </Badge>
                                        <Badge variant="secondary" className={`text-[9px] px-1.5 ${sourceColors[log.source] || ''}`}>
                                            {log.source}
                                        </Badge>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{log.message}</p>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                            <span>{formatDate(log.created_at)}</span>
                                            {log.path && <span className="font-mono">{log.path}</span>}
                                            {log.user_id && <span>user: {log.user_id.slice(0, 8)}...</span>}
                                        </div>
                                    </div>
                                </div>
                                {expandedId === log.id && log.stack && (
                                    <pre className="mt-2 p-3 bg-muted/50 rounded-md text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all">
                                        {log.stack}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
