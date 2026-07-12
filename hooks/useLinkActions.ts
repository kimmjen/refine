import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SharedLink } from '@/types/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';

interface UseLinkActionsProps {
    initialLink: SharedLink;
}

interface UseLinkActionsReturn {
    link: SharedLink;
    isDeleting: boolean;
    isEditingCategory: boolean;
    error: string | null;
    setIsEditingCategory: (value: boolean) => void;
    handleDelete: () => Promise<void>;
    handleToggleRead: () => Promise<void>;
    handleCategoryUpdate: (newCategory: string) => Promise<void>;
}

export function useLinkActions({ initialLink }: UseLinkActionsProps): UseLinkActionsReturn {
    const router = useRouter();
    const { session } = useAuth();
    const { toast } = useToast();
    const [link, setLink] = useState(initialLink);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync state when initialLink updates (e.g. after data fetch)
    // Sync state when initialLink updates (e.g. after data fetch)
    useEffect(() => {
        // Only update if the initialLink has changed significantly (e.g. ID change) to avoid infinite loops
        if (initialLink && initialLink.id !== link.id) {
            setLink(initialLink);
        }
    }, [initialLink, link.id]);

    const handleDelete = async () => {
        if (!confirm('정말 이 링크를 삭제하시겠습니까?')) return;
        setIsDeleting(true);

        try {
            const response = await fetch(`/api/delete-link?id=${link.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
                }
            });
            if (!response.ok) throw new Error('삭제 실패');
            router.replace('/');
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Delete failed';
            setError(msg);
            toast(msg, 'error');
            setIsDeleting(false);
        }
    };

    const handleToggleRead = async () => {
        const newStatus = !link.is_read;
        const oldStatus = link.is_read;
        setLink({ ...link, is_read: newStatus });

        try {
            const response = await fetch('/api/toggle-read', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
                },
                body: JSON.stringify({ id: link.id, is_read: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to toggle read status');
        } catch {
            setLink({ ...link, is_read: oldStatus });
        }
    };

    const handleCategoryUpdate = async (newCategory: string) => {
        const oldCategory = link.category;
        setLink({ ...link, category: newCategory });
        setIsEditingCategory(false);

        try {
            const res = await fetch('/api/update-link', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
                },
                body: JSON.stringify({ id: link.id, category: newCategory }),
            });
            if (!res.ok) throw new Error('Update failed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Category update failed';
            setError(msg);
            toast(msg, 'error');
            setLink({ ...link, category: oldCategory });
        }
    };

    return {
        link,
        isDeleting,
        isEditingCategory,
        error,
        setIsEditingCategory,
        handleDelete,
        handleToggleRead,
        handleCategoryUpdate,
    };
}
