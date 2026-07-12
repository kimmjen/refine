import { useState, useEffect, useCallback, useRef } from 'react';
import { SharedLink } from '@/types/db';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseBrowserClient } from '@/lib/supabase';

const PAGE_SIZE = 20;

type SortField = 'created_at' | 'title' | 'platform' | 'category';
type SortOrder = 'desc' | 'asc';

interface UseLinksOptions {
    showRead: boolean;
    selectedCategory: string | null;
    searchQuery: string;
    sortBy: SortField;
    sortOrder: SortOrder;
}

interface UseLinksReturn {
    links: SharedLink[];
    isLoadingLinks: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    totalCount: number;
    readCount: number;
    unreadCount: number;
    page: number;
    error: string | null;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    refresh: () => void;
    toggleRead: (id: number, currentStatus: boolean) => Promise<void>;
}

export function useLinks(options: UseLinksOptions): UseLinksReturn {
    const { user, session, isLoading: authLoading } = useAuth();
    const { showRead, selectedCategory, searchQuery, sortBy, sortOrder } = options;

    const [links, setLinks] = useState<SharedLink[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [readCount, setReadCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search query (300ms)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch links with server-side filtering + pagination
    const fetchLinks = useCallback(async (pageNum: number, append = false) => {
        if (!user) { setLinks([]); setIsLoadingLinks(false); return; }

        if (pageNum === 0) { setIsLoadingLinks(true); setError(null); }
        else setIsLoadingMore(true);

        try {
            const supabase = createSupabaseBrowserClient();
            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            let query = supabase
                .from('shared_links')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id);

            if (!showRead) {
                query = query.eq('is_read', false);
            }
            if (selectedCategory) {
                query = query.eq('category', selectedCategory);
            }
            if (debouncedSearch) {
                query = query.or(`title.ilike.%${debouncedSearch}%,url.ilike.%${debouncedSearch}%`);
            }

            const { data, error, count } = await query
                .order(sortBy, { ascending: sortOrder === 'asc' })
                .range(from, to);

            if (error) throw error;

            if (append) {
                setLinks(prev => [...prev, ...(data || [])]);
            } else {
                setLinks(data || []);
            }

            setTotalCount(count || 0);
            setHasMore((data?.length || 0) === PAGE_SIZE);
            setPage(pageNum);

            // Fetch read/unread counts on first page
            if (pageNum === 0) {
                const [totalRes, readRes] = await Promise.all([
                    supabase.from('shared_links').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                    supabase.from('shared_links').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', true),
                ]);
                const total = totalRes.count || 0;
                const read = readRes.count || 0;
                setReadCount(read);
                setUnreadCount(total - read);
            }
        } catch (e) {
            console.error(e);
            if (pageNum === 0) setError(e instanceof Error ? e.message : 'Failed to load links');
        } finally {
            setIsLoadingLinks(false);
            setIsLoadingMore(false);
        }
    }, [user, sortBy, sortOrder, showRead, selectedCategory, debouncedSearch]);

    // Initial load
    useEffect(() => {
        if (!authLoading && user) {
            fetchLinks(0);
        } else if (!authLoading) {
            setLinks([]);
            setIsLoadingLinks(false);
        }
    }, [authLoading, user, fetchLinks]);

    // Infinite scroll observer
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoadingLinks) {
                    fetchLinks(page + 1, true);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [hasMore, isLoadingMore, isLoadingLinks, page, fetchLinks]);

    const refresh = useCallback(() => {
        setPage(0);
        setHasMore(true);
        fetchLinks(0);
    }, [fetchLinks]);

    const toggleRead = useCallback(async (id: number, currentStatus: boolean) => {
        if (!session) return;
        const newStatus = !currentStatus;

        // Optimistic update
        setLinks(prev => prev.map(l => l.id === id ? { ...l, is_read: newStatus } : l));
        if (newStatus) {
            setReadCount(prev => prev + 1);
            setUnreadCount(prev => prev - 1);
        } else {
            setReadCount(prev => prev - 1);
            setUnreadCount(prev => prev + 1);
        }

        try {
            await fetch('/api/toggle-read', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ id, is_read: newStatus }),
            });
        } catch {
            // Rollback on error
            setLinks(prev => prev.map(l => l.id === id ? { ...l, is_read: currentStatus } : l));
            if (newStatus) {
                setReadCount(prev => prev - 1);
                setUnreadCount(prev => prev + 1);
            } else {
                setReadCount(prev => prev + 1);
                setUnreadCount(prev => prev - 1);
            }
        }
    }, [session]);

    return {
        links,
        isLoadingLinks,
        isLoadingMore,
        hasMore,
        totalCount,
        readCount,
        unreadCount,
        page,
        error,
        loadMoreRef,
        refresh,
        toggleRead,
    };
}
