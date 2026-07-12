

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import LayoutShell from '@/components/layout/LayoutShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/common/Toast';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/next-i18next.config.js';
import type { GetStaticProps } from 'next';

interface Category {
    id: string;
    name: string;
    sort_order: number;
    linkCount?: number;
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
    props: {
        ...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
    },
});

export default function CategoriesPage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { toast } = useToast();
    const { t } = useTranslation('common');

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!authLoading && !user) router.replace('/auth/login');
    }, [user, authLoading, router]);

    const fetchCategories = useCallback(async () => {
        if (!user) return;
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            // Fetch categories
            const res = await fetch('/api/categories', {
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);

            // Fetch link counts per category
            const { data: links } = await supabase
                .from('shared_links')
                .select('category')
                .eq('user_id', user.id);

            const countMap: Record<string, number> = {};
            links?.forEach((l) => {
                const cat = l.category || 'Uncategorized';
                countMap[cat] = (countMap[cat] || 0) + 1;
            });

            const enriched = result.categories.map((c: Category) => ({
                ...c,
                linkCount: countMap[c.name] || 0,
            }));

            setCategories(enriched);
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleAdd = async () => {
        const name = newCategoryName.trim();
        if (!name) return;

        setIsAdding(true);
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ name }),
            });
            const result = await res.json();

            if (res.status === 409) {
                toast(t('category_already_exists'), 'error');
                return;
            }
            if (!res.ok) throw new Error(result.error);

            setCategories(prev => [...prev, { ...result.category, linkCount: 0 }]);
            setNewCategoryName('');
            toast(t('category_added', { name }), 'success');
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to add', 'error');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(t('category_delete_confirm', { name }))) return;

        setDeletingId(id);
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const res = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session?.access_token}` },
            });
            if (!res.ok) throw new Error('Failed to delete');

            setCategories(prev => prev.filter(c => c.id !== id));
            toast(t('category_deleted', { name }), 'success');
        } catch (err: unknown) {
            toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    // Drag & Drop reorder
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = async (index: number) => {
        if (draggedIndex === null || draggedIndex === index) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newCategories = [...categories];
        const [moved] = newCategories.splice(draggedIndex, 1);
        newCategories.splice(index, 0, moved);

        // Update sort_order
        const orders = newCategories.map((c, i) => ({ id: c.id, sort_order: i }));
        setCategories(newCategories.map((c, i) => ({ ...c, sort_order: i })));
        setDraggedIndex(null);
        setDragOverIndex(null);

        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        try {
            const res = await fetch('/api/categories', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ orders }),
            });
            if (!res.ok) throw new Error('Failed to reorder');
        } catch {
            toast(t('category_reorder_failed'), 'error');
            fetchCategories(); // rollback
        }
    };

    if (authLoading) {
        return (
            <LayoutShell>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </LayoutShell>
        );
    }

    if (!user) return null;

    return (
        <>
            <Head><title>{t('category_management')} - Refine</title></Head>
            <LayoutShell>
                <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mb-4">
                        <Link href="/"><ArrowLeft size={14} />{t('back')}</Link>
                    </Button>

                    <div className="flex items-center gap-3">
                        <Tag size={20} className="text-primary" />
                        <h1 className="text-xl font-semibold">{t('category_management')}</h1>
                        <Badge variant="secondary" className="text-xs">{t('category_count', { count: categories.length })}</Badge>
                    </div>

                    {/* Add Category */}
                    <Card>
                        <CardContent className="pt-4">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder={t('category_name_placeholder')}
                                    className="flex-1 h-9 text-sm"
                                />
                                <Button type="submit" size="sm" disabled={isAdding || !newCategoryName.trim()} className="h-9 px-3">
                                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Category List */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('category_drag_hint')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0.5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-11 bg-muted/30 rounded-md animate-pulse" />
                                ))
                            ) : categories.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">{t('category_empty')}</p>
                            ) : (
                                categories.map((cat, index) => (
                                    <div
                                        key={cat.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                                        onDrop={() => handleDrop(index)}
                                        className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors
                      hover:bg-muted/50 cursor-grab active:cursor-grabbing
                      ${draggedIndex === index ? 'opacity-50 bg-muted' : ''}
                      ${dragOverIndex === index && draggedIndex !== index ? 'border-t-2 border-primary' : ''}
                    `}
                                    >
                                        <GripVertical size={14} className="text-muted-foreground/50 shrink-0" />
                                        <span className="flex-1 text-sm font-medium">{cat.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                                            {cat.linkCount || 0}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => handleDelete(cat.id, cat.name)}
                                            disabled={deletingId === cat.id}
                                        >
                                            {deletingId === cat.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={12} />
                                            )}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </LayoutShell>
        </>
    );
}
