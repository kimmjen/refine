import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Loader2, Users, RefreshCcw, X, Trash2, Settings, Link as LinkIcon
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { adminFetch } from './utils';
import { useTranslation } from 'next-i18next';

export function UsersTab() {
    const { t } = useTranslation('common');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [userLinks, setUserLinks] = useState<any[]>([]);
    const [userSettings, setUserSettings] = useState<any | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminFetch('/api/admin/users');
            if (res.ok) {
                const json = await res.json();
                setUsers(json.data);
            }
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleRole = async (id: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const res = await adminFetch('/api/admin/users', {
            method: 'PUT',
            body: JSON.stringify({ id, updates: { role: newRole } }),
        });
        if (res.ok) fetchUsers();
    };

    const deleteUser = async (id: string) => {
        if (!confirm(t('admin_delete_user_confirm'))) return;
        setDeleting(id);
        const res = await adminFetch('/api/admin/users', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
        });
        if (res.ok) { fetchUsers(); if (selectedUser?.id === id) setSelectedUser(null); }
        setDeleting(null);
    };

    const viewUserDetail = async (user: any) => {
        if (selectedUser?.id === user.id) { setSelectedUser(null); return; }
        setSelectedUser(user);
        setDetailLoading(true);
        setUserLinks([]);
        setUserSettings(null);
        try {
            const [linksRes, settingsRes] = await Promise.all([
                adminFetch(`/api/admin/db?table=shared_links&page=1&pageSize=50&sortBy=created_at&sortOrder=desc`),
                adminFetch(`/api/admin/db?table=ai_settings&page=1&pageSize=1`),
            ]);
            if (linksRes.ok) {
                const lJson = await linksRes.json();
                setUserLinks((lJson.data || []).filter((l: any) => l.user_id === user.id));
            }
            if (settingsRes.ok) {
                const sJson = await settingsRes.json();
                const userSetting = (sJson.data || []).find((s: any) => s.user_id === user.id);
                setUserSettings(userSetting || null);
            }
        } catch { /* */ } finally { setDetailLoading(false); }
    };

    return (
        <div className="space-y-4">
            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> {t('admin_auth_users')}
                            </CardTitle>
                            <CardDescription className="mt-1">{t('admin_users_desc', { count: users.length })}</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-1.5 h-9">
                            <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {t('admin_refresh')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-background text-muted-foreground text-xs uppercase font-medium border-b border-border/50">
                            <tr>
                                <th className="px-4 py-3">{t('admin_user')}</th>
                                <th className="px-4 py-3">{t('admin_provider')}</th>
                                <th className="px-4 py-3">{t('admin_role')}</th>
                                <th className="px-4 py-3">{t('admin_last_sign_in')}</th>
                                <th className="px-4 py-3 text-right">{t('admin_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
                            ) : users.map(u => (
                                <tr key={u.id} className={`hover:bg-muted/20 transition-colors cursor-pointer ${selectedUser?.id === u.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`} onClick={() => viewUserDetail(u)}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full" />
                                            ) : (
                                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{(u.email || '?')[0].toUpperCase()}</div>
                                            )}
                                            <div>
                                                <div className="text-xs font-medium">{u.full_name}</div>
                                                <div className="text-[10px] text-muted-foreground">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{u.provider}</Badge></td>
                                    <td className="px-4 py-3">
                                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={`text-[10px] cursor-pointer ${u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}`} onClick={(e) => { e.stopPropagation(); toggleRole(u.id, u.role); }}>
                                            {u.role}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteUser(u.id); }} disabled={deleting === u.id} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                                            {deleting === u.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {/* User Detail Panel */}
            {selectedUser && (
                <Card className="border-border/50 shadow-sm overflow-hidden border-l-2 border-l-primary animate-in fade-in slide-in-from-top-2 duration-300">
                    <CardHeader className="bg-primary/5 border-b border-border/50 pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedUser.avatar_url ? (
                                    <img src={selectedUser.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">{(selectedUser.email || '?')[0].toUpperCase()}</div>
                                )}
                                <div>
                                    <CardTitle className="text-sm font-semibold">{selectedUser.full_name}</CardTitle>
                                    <CardDescription className="text-[10px]">{selectedUser.email} · ID: {selectedUser.id.slice(0, 8)}...</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="h-7 w-7 p-0"><X className="h-4 w-4" /></Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {detailLoading ? (
                            <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                        ) : (
                            <>
                                {/* User AI Settings */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Settings className="h-3 w-3" /> {t('admin_tab_ai_settings')}
                                    </h4>
                                    {userSettings ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <div className="bg-muted/30 rounded px-3 py-2">
                                                <div className="text-[10px] text-muted-foreground">{t('admin_provider')}</div>
                                                <div className="text-xs font-medium">{userSettings.ai_provider}</div>
                                            </div>
                                            <div className="bg-muted/30 rounded px-3 py-2">
                                                <div className="text-[10px] text-muted-foreground">{t('admin_language')}</div>
                                                <div className="text-xs font-medium">{userSettings.preferred_language}</div>
                                            </div>
                                            <div className="bg-muted/30 rounded px-3 py-2">
                                                <div className="text-[10px] text-muted-foreground">{t('admin_auto_classify')}</div>
                                                <div className="text-xs font-medium">{userSettings.ai_auto_classify ? '✅' : '❌'}</div>
                                            </div>
                                            <div className="bg-muted/30 rounded px-3 py-2">
                                                <div className="text-[10px] text-muted-foreground">{t('admin_auto_summary')}</div>
                                                <div className="text-xs font-medium">{userSettings.ai_auto_summary ? '✅' : '❌'}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">{t('admin_no_ai_settings')}</p>
                                    )}
                                </div>

                                {/* User Links */}
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <LinkIcon className="h-3 w-3" /> {t('admin_saved_links')}
                                        <Badge variant="secondary" className="text-[9px]">{userLinks.length}</Badge>
                                    </h4>
                                    {userLinks.length > 0 ? (
                                        <div className="max-h-[300px] overflow-y-auto border border-border/50 rounded-md">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-muted/30 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2 font-medium">{t('title')}</th>
                                                        <th className="px-3 py-2 font-medium">{t('sort_platform')}</th>
                                                        <th className="px-3 py-2 font-medium">{t('sort_category')}</th>
                                                        <th className="px-3 py-2 font-medium text-right">{t('admin_added')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border/30">
                                                    {userLinks.map(link => (
                                                        <tr key={link.id} className="hover:bg-muted/20">
                                                            <td className="px-3 py-1.5">
                                                                <span className="cursor-pointer hover:text-primary truncate max-w-[200px] inline-block" onClick={() => window.open(link.url, '_blank')} title={link.url}>
                                                                    {link.title || link.url.replace(/^https?:\/\//, '').slice(0, 40)}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-1.5"><Badge variant="secondary" className="text-[9px]">{link.platform || 'Web'}</Badge></td>
                                                            <td className="px-3 py-1.5 text-muted-foreground">{link.category || '-'}</td>
                                                            <td className="px-3 py-1.5 text-right text-muted-foreground">{formatDate(link.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">{t('admin_no_links')}</p>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
