import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Database } from 'lucide-react';
import { adminFetch } from './utils';
import { useTranslation } from 'next-i18next';

export function SchemaTab() {
    const { t } = useTranslation('common');
    const [view, setView] = useState<'tables' | 'functions' | 'triggers' | 'policies'>('tables');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSchema = useCallback(async (type: string) => {
        setLoading(true);
        try {
            const res = await adminFetch(`/api/admin/sql?type=${type}`);
            if (res.ok) { const json = await res.json(); setData(json.data || []); }
        } catch { /* */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchSchema(view === 'tables' ? 'schema' : view); }, [view, fetchSchema]);

    const subTabs = [
        { id: 'tables' as const, label: t('admin_tables_columns') },
        { id: 'functions' as const, label: t('admin_functions') },
        { id: 'triggers' as const, label: t('admin_triggers') },
        { id: 'policies' as const, label: t('admin_policies') },
    ];

    // Group tables
    const grouped = view === 'tables' ? data.reduce((acc: Record<string, any[]>, row: any) => {
        (acc[row.table_name] = acc[row.table_name] || []).push(row);
        return acc;
    }, {}) : {};

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> {t('admin_db_schema')}</CardTitle>
                <div className="flex gap-1 mt-3">
                    {subTabs.map(st => (
                        <Button key={st.id} variant={view === st.id ? "default" : "secondary"} size="sm" onClick={() => setView(st.id)}
                            className="h-7 px-3 text-[11px] font-medium">
                            {st.label}
                        </Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : view === 'tables' ? (
                    <div className="divide-y divide-border/50">
                        {Object.entries(grouped).map(([tableName, cols]: [string, any[]]) => (
                            <div key={tableName} className="px-4 py-3">
                                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                    <Database className="h-3 w-3 text-primary" />{tableName}
                                    <Badge variant="secondary" className="text-[9px] ml-1">{cols.length} cols</Badge>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                                    {cols.map((col: any) => (
                                        <div key={col.column_name} className="text-[11px] flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded">
                                            <span className="font-medium text-foreground">{col.column_name}</span>
                                            <span className="text-muted-foreground">{col.data_type}{col.character_maximum_length ? `(${col.character_maximum_length})` : ''}</span>
                                            {col.is_nullable === 'NO' && <Badge variant="outline" className="text-[8px] h-3.5 px-1">NOT NULL</Badge>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {Object.keys(grouped).length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No tables found. Run the SQL migration first.</div>}
                    </div>
                ) : (
                    <table className="w-full text-xs text-left">
                        <thead className="bg-background text-muted-foreground uppercase font-medium border-b border-border/50 sticky top-0">
                            <tr>
                                {view === 'functions' && <><th className="px-4 py-2.5">Function</th><th className="px-4 py-2.5">Arguments</th><th className="px-4 py-2.5">Returns</th><th className="px-4 py-2.5">Language</th></>}
                                {view === 'triggers' && <><th className="px-4 py-2.5">Trigger</th><th className="px-4 py-2.5">Table</th><th className="px-4 py-2.5">Event</th><th className="px-4 py-2.5">Timing</th></>}
                                {view === 'policies' && <><th className="px-4 py-2.5">Policy</th><th className="px-4 py-2.5">Table</th><th className="px-4 py-2.5">Command</th><th className="px-4 py-2.5">Type</th></>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {data.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No data. Run the SQL migration first.</td></tr>
                            ) : data.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-muted/20">
                                    {view === 'functions' && <>
                                        <td className="px-4 py-2 font-medium">{row.function_name}</td>
                                        <td className="px-4 py-2 text-muted-foreground font-mono">{row.arguments || '-'}</td>
                                        <td className="px-4 py-2">{row.return_type}</td>
                                        <td className="px-4 py-2"><Badge variant="secondary" className="text-[9px]">{row.language}</Badge></td>
                                    </>}
                                    {view === 'triggers' && <>
                                        <td className="px-4 py-2 font-medium">{row.trigger_name}</td>
                                        <td className="px-4 py-2">{row.table_name}</td>
                                        <td className="px-4 py-2"><Badge variant="secondary" className="text-[9px]">{row.event}</Badge></td>
                                        <td className="px-4 py-2">{row.timing}</td>
                                    </>}
                                    {view === 'policies' && <>
                                        <td className="px-4 py-2 font-medium">{row.policy_name}</td>
                                        <td className="px-4 py-2">{row.table_name}</td>
                                        <td className="px-4 py-2"><Badge variant="secondary" className="text-[9px]">{row.command}</Badge></td>
                                        <td className="px-4 py-2">{row.type}</td>
                                    </>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}
