/* eslint-disable @next/next/no-img-element */
import { ListVideo, PlayCircle } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { YoutubeVideo } from '@/hooks/useYoutubePlaylist';
import { useTranslation } from 'next-i18next';

interface YoutubePlayerProps {
    embedUrl: string;
    listId: string | null;
    playlistItems: YoutubeVideo[];
    currentVideoId: string | null;
    isLoadingPlaylist: boolean;
    onVideoSelect: (videoId: string) => void;
}

export default function YoutubePlayer({
    embedUrl,
    listId,
    playlistItems,
    currentVideoId,
    isLoadingPlaylist,
    onVideoSelect,
}: YoutubePlayerProps) {
    const { t } = useTranslation('common');
    const handleVideoClick = (videoId: string) => {
        onVideoSelect(videoId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Video Embed */}
            {embedUrl && (
                <div className="aspect-video w-full">
                    <iframe
                        className="w-full h-full"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {/* Playlist Section */}
            {listId && playlistItems.length > 0 && (
                <div className="bg-card rounded-refine shadow-lg overflow-hidden border border-border mt-6">
                    <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ListVideo size={20} className="text-red-600" />
                            <h3 className="font-bold text-foreground">Playlist Content</h3>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                                {playlistItems.length}
                            </span>
                        </div>
                    </div>

                    <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                        {playlistItems.map((video, index) => (
                            <button
                                key={video.videoId}
                                onClick={() => handleVideoClick(video.videoId)}
                                className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group ${currentVideoId === video.videoId ? 'bg-red-50 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/20' : ''
                                    }`}
                            >
                                <span className="text-muted-foreground font-mono text-sm w-6 text-center shrink-0">
                                    {index + 1}
                                </span>
                                <div className="relative w-24 aspect-video bg-muted rounded-lg overflow-hidden shrink-0">
                                    <img
                                        src={video.videoThumbnails[0]?.url.startsWith('http')
                                            ? video.videoThumbnails[0].url
                                            : `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {currentVideoId === video.videoId && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <PlayCircle size={20} className="text-white fill-red-600" />
                                        </div>
                                    )}
                                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 rounded font-bold">
                                        {formatDuration(video.lengthSeconds)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-sm font-bold truncate pr-4 ${currentVideoId === video.videoId ? 'text-red-600' : 'text-foreground group-hover:text-red-600'
                                        }`}>
                                        {video.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {video.author}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading State */}
            {listId && isLoadingPlaylist && (
                <div className="text-center py-8 text-muted-foreground bg-card rounded-refine border border-border border-dashed mt-6">
                    <p>{t('loading_playlist')}</p>
                </div>
            )}
        </>
    );
}
