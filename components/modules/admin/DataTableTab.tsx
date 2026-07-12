import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Loader2, Database, RefreshCcw, Trash2, Edit, ChevronLeft, ChevronRight, Search, X, Save
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { adminFetch } from './utils';
import { useTranslation } from 'next-i18next';

export function DataTableTab({ tableName, columns, pkField = 'id', searchable = false }: {
    tableName: string;
    columns: { key: string; label: string; editable?: boolean; width?: string }[];
    pkField?: string;
    searchable?: boolean;
}) {
    const { t } = useTranslation('common');
    const [rows, setRows] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editData, setEditData] = useState<Record<string, any>>({});
    const [deleting, setDeleting] = useState<string | number | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ table: tableName, page: String(page), pageSize: '15' });
            if (search) params.set('search', search);
            const res = await adminFetch(`/api/admin/db?${params}`);
            if (res.ok) {
                const json = await res.json();
                setRows(json.data);
                setTotal(json.total);
                setTotalPages(json.totalPages);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [tableName, page, search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleEdit = (row: any) => {
        setEditingId(row[pkField]);
        const editable: Record<string, any> = {};
        columns.filter(c => c.editable).forEach(c => { editable[c.key] = row[c.key]; });
        setEditData(editable);
    };

    const handleSave = async () => {
        if (!editingId) return;
        const res = await adminFetch('/api/admin/db?table=' + tableName, {
            method: 'PUT',
            body: JSON.stringify({ id: editingId, updates: editData }),
        });
        if (res.ok) {
            setEditingId(null);
            fetchData();
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm(t('admin_delete_confirm'))) return;
        setDeleting(id);
        const res = await adminFetch('/api/admin/db?table=' + tableName, {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
        if (res.ok) fetchData();
        setDeleting(null);
    };

    return (
        <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" /> {tableName}
                        </CardTitle>
                        <CardDescription className="mt-1">{total} records</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {searchable && (
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder={t('admin_search')}
                                    value={search}
                                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                                    className="h-9 w-48 pl-8 pr-8 text-xs"
                                />
                                {search && (
                                    <Button variant="ghost" size="icon" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-2 top-2 h-6 w-6">
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        )}
                        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5 h-9">
                            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('admin_refresh')}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background text-muted-foreground text-xs uppercase font-medium border-b border-border/50">
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key} className="px-4 py-3 font-semibold" style={col.width ? { width: col.width } : undefined}>{col.label}</th>
                                ))}
                                <th className="px-4 py-3 font-semibold text-right w-24">{t('admin_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading && rows.length === 0 ? (
                                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">{t('admin_no_data')}</td></tr>
                            ) : rows.map(row => (
                                <tr key={row[pkField]} className="hover:bg-muted/20 transition-colors">
                                    {columns.map(col => (
                                        <td key={col.key} className="px-4 py-2.5">
                                            {editingId === row[pkField] && col.editable ? (
                                                <Input
                                                    value={editData[col.key] ?? ''}
                                                    onChange={e => setEditData(d => ({ ...d, [col.key]: e.target.value }))}
                                                    className="w-full h-8 px-2 text-xs border-primary/50"
                                                />
                                            ) : (
                                                <CellValue value={row[col.key]} colKey={col.key} />
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-2.5 text-right">
                                        {editingId === row[pkField] ? (
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={handleSave} className="h-7 w-7 p-0 text-green-500 hover:text-green-600"><Save className="h-3.5 w-3.5" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="h-7 w-7 p-0 text-muted-foreground"><X className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-1">
                                                {columns.some(c => c.editable) && (
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(row[pkField])} disabled={deleting === row[pkField]} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                                                    {deleting === row[pkField] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
                        <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} total)</span>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="h-7 w-7 p-0"><ChevronLeft className="h-3.5 w-3.5" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="h-7 w-7 p-0"><ChevronRight className="h-3.5 w-3.5" /></Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function CellValue({ value, colKey }: { value: any; colKey: string }) {
    if (value === null || value === undefined) return <span className="text-muted-foreground/40 text-xs">null</span>;
    if (typeof value === 'boolean') return <Badge variant={value ? 'default' : 'secondary'} className="text-[10px]">{value ? 'Yes' : 'No'}</Badge>;
    if (colKey.includes('url') && typeof value === 'string' && value.startsWith('http')) {
        return (
            <span className="text-xs truncate max-w-[200px] inline-block cursor-pointer text-primary hover:underline" onClick={() => window.open(value, '_blank')} title={value}>
                {value.replace(/^https?:\/\//, '').slice(0, 40)}...
            </span>
        );
    }
    if (colKey.includes('_at') || colKey.includes('created') || colKey.includes('updated')) {
        return <span className="text-xs text-muted-foreground">{formatDate(String(value))}</span>;
    }
    if (colKey.includes('api_key') && typeof value === 'string' && value.length > 8) {
        return <span className="text-xs font-mono text-muted-foreground">{value.slice(0, 4)}...{value.slice(-4)}</span>;
    }
    if (Array.isArray(value)) return <span className="text-xs">{value.join(', ')}</span>;
    const str = String(value);
    if (str.length > 60) return <span className="text-xs truncate max-w-[250px] inline-block" title={str}>{str.slice(0, 60)}...</span>;
    return <span className="text-xs">{str}</span>;
}
