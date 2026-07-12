import { LinkMetadata } from '@/types/db';

interface PlatformMetadataCardProps {
    metadata: LinkMetadata | null | undefined;
}

export default function PlatformMetadataCard({ metadata }: PlatformMetadataCardProps) {
    if (!metadata) return null;

    const hasContent = metadata.github_stars != null ||
        metadata.twitter_author ||
        metadata.reddit_subreddit ||
        metadata.youtube_thumbnail;

    if (!hasContent) return null;

    return (
        <div className="mb-8 p-4 bg-muted/50 rounded-xl border border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Platform Info</h3>

            {/* GitHub */}
            {metadata.github_stars != null && (
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                        <span className="text-yellow-500">*</span>
                        <span className="font-bold text-foreground">{metadata.github_stars?.toLocaleString()}</span>
                        <span className="text-muted-foreground">stars</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                        <span className="font-bold text-foreground">{metadata.github_forks?.toLocaleString()}</span>
                        <span className="text-muted-foreground">forks</span>
                    </span>
                    {metadata.github_language && (
                        <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                            <span className="font-bold text-foreground">{metadata.github_language}</span>
                        </span>
                    )}
                </div>
            )}

            {/* Twitter */}
            {metadata.twitter_author && (
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                        <span className="font-bold text-foreground">@{metadata.twitter_author}</span>
                    </span>
                </div>
            )}

            {/* YouTube */}
            {metadata.youtube_thumbnail && (
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                        <span className="font-bold text-foreground">YouTube Video</span>
                    </span>
                </div>
            )}

            {/* Reddit */}
            {metadata.reddit_subreddit && (
                <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                        <span className="font-bold text-foreground">r/{metadata.reddit_subreddit}</span>
                    </span>
                    {metadata.reddit_upvotes != null && (
                        <span className="flex items-center gap-1.5 bg-background px-3 py-2 rounded-lg border border-border">
                            <span className="font-bold text-foreground">{metadata.reddit_upvotes?.toLocaleString()}</span>
                            <span className="text-muted-foreground">upvotes</span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
