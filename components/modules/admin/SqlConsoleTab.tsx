import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Database, Activity } from 'lucide-react';
import { adminFetch } from './utils';
import { useTranslation } from 'next-i18next';

export function SqlConsoleTab() {
    const { t } = useTranslation('common');
    const [query, setQuery] = useState('SELECT * FROM shared_links ORDER BY id DESC LIMIT 10');
    const [results, setResults] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const executeQuery = async () => {
        setLoading(true);
        setError(null);
        setResults(null);
        try {
            const res = await adminFetch('/api/admin/sql', {
                method: 'POST',
                body: JSON.stringify({ query }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            setResults(json.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

    return (
        <div className="space-y-4">
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Database className="h-4 w-4 text-primary" /> {t('admin_sql_console')}
                        <Badge variant="secondary" className="text-[9px]">{t('admin_select_only')}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <textarea
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="SELECT * FROM shared_links LIMIT 10"
                        className="w-full h-24 px-3 py-2 text-xs font-mono bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) executeQuery(); }}
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{t('admin_execute_hint')}</span>
                        <Button size="sm" onClick={executeQuery} disabled={loading || !query.trim()} className="gap-1.5 h-8 text-xs">
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Activity className="h-3.5 w-3.5" />}
                            {t('admin_execute')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-xs font-mono">{error}</div>
            )}

            {results !== null && (
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-2.5 px-4">
                        <CardDescription className="text-[11px]">{t('admin_rows_returned', { count: results.length })}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-background text-muted-foreground uppercase font-medium border-b border-border/50 sticky top-0">
                                    <tr>{columns.map(col => <th key={col} className="px-3 py-2 whitespace-nowrap">{col}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-border/50 font-mono">
                                    {results.length === 0 ? (
                                        <tr><td colSpan={columns.length || 1} className="px-3 py-8 text-center text-muted-foreground">{t('admin_no_results')}</td></tr>
                                    ) : results.map((row, i) => (
                                        <tr key={i} className="hover:bg-muted/20">
                                            {columns.map(col => (
                                                <td key={col} className="px-3 py-1.5 whitespace-nowrap max-w-[300px] truncate" title={String(row[col] ?? '')}>
                                                    {row[col] === null ? <span className="text-muted-foreground/40">null</span> : String(row[col]).slice(0, 100)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
