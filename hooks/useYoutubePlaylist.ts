import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export interface YoutubeVideo {
    title: string;
    videoId: string;
    lengthSeconds: number;
    videoThumbnails: { quality: string; url: string }[];
    author: string;
    index: number;
}

interface UseYoutubePlaylistProps {
    listId: string | null;
    initialVideoId: string | null;
}

interface UseYoutubePlaylistReturn {
    playlistItems: YoutubeVideo[];
    currentVideoId: string | null;
    setCurrentVideoId: (id: string) => void;
    isLoadingPlaylist: boolean;
    embedUrl: string;
}

export function useYoutubePlaylist({ listId, initialVideoId }: UseYoutubePlaylistProps): UseYoutubePlaylistReturn {
    const [playlistItems, setPlaylistItems] = useState<YoutubeVideo[]>([]);
    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);

    useEffect(() => {
        if (initialVideoId && !currentVideoId) {
            setCurrentVideoId(initialVideoId);
        }
    }, [initialVideoId, currentVideoId]);

    useEffect(() => {
        if (listId) {
            setIsLoadingPlaylist(true);

            const fetchPlaylist = async () => {
                const supabase = createSupabaseBrowserClient();
                const { data: { session } } = await supabase.auth.getSession();
                const headers: HeadersInit = session?.access_token
                    ? { 'Authorization': `Bearer ${session.access_token}` }
                    : {};

                try {
                    const res = await fetch(`/api/playlist?list=${listId}`, { headers });
                    if (!res.ok) throw new Error('Network response was not ok');
                    const data = await res.json();
                    if (data.videos) {
                        setPlaylistItems(data.videos);
                        if (!initialVideoId && data.videos.length > 0) {
                            setCurrentVideoId(data.videos[0].videoId);
                        }
                    }
                } catch (err) {
                    console.warn('Failed to load playlist:', err);
                    setPlaylistItems([]);
                } finally {
                    setIsLoadingPlaylist(false);
                }
            };

            fetchPlaylist();
        }
    }, [listId, initialVideoId]);

    let embedUrl = '';
    if (currentVideoId) {
        embedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1`;
        if (listId) embedUrl += `&list=${listId}`;
    } else if (listId) {
        embedUrl = `https://www.youtube.com/embed/videoseries?list=${listId}`;
    }

    return {
        playlistItems,
        currentVideoId,
        setCurrentVideoId,
        isLoadingPlaylist,
        embedUrl,
    };
}
