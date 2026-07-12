import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useToast } from '@/components/common/Toast';

export interface Category {
    id: number;
    name: string;
    sort_order: number;
}

interface UseCategoriesReturn {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    addCategory: (name: string) => Promise<boolean>;
    deleteCategory: (id: number) => Promise<boolean>;
    reorderCategories: (orders: { id: number; sort_order: number }[]) => Promise<boolean>;
    refetch: () => Promise<void>;
}

export function useCategories(): UseCategoriesReturn {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 인증 헤더 생성
    const getAuthHeaders = async (): Promise<HeadersInit> => {
        const supabase = createSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.access_token) {
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            };
        }
        return { 'Content-Type': 'application/json' };
    };

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/categories', { headers });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (err) {
            setError('카테고리를 불러오는데 실패했습니다.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (name: string): Promise<boolean> => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers,
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const data = await res.json();
                if (res.status === 409) {
                    toast('이미 존재하는 카테고리입니다.', 'error');
                } else {
                    toast(data.error || '카테고리 추가 실패', 'error');
                }
                return false;
            }

            const data = await res.json();
            setCategories(prev => [...prev, data.category]);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const deleteCategory = async (id: number): Promise<boolean> => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
                headers,
            });

            if (!res.ok) throw new Error('Delete failed');

            setCategories(prev => prev.filter(c => c.id !== id));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const reorderCategories = async (
        orders: { id: number; sort_order: number }[]
    ): Promise<boolean> => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/categories', {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ orders }),
            });

            if (!res.ok) throw new Error('Reorder failed');

            // 로컬 상태 업데이트
            setCategories(prev => {
                const updated = [...prev];
                orders.forEach(({ id, sort_order }) => {
                    const cat = updated.find(c => c.id === id);
                    if (cat) cat.sort_order = sort_order;
                });
                return updated.sort((a, b) => a.sort_order - b.sort_order);
            });

            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    return {
        categories,
        isLoading,
        error,
        addCategory,
        deleteCategory,
        reorderCategories,
        refetch: fetchCategories,
    };
}
