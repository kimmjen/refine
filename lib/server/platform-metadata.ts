/**
 * 서버 전용 — 플랫폼별 메타데이터 수집 서비스
 */
import { getGitHubInfo, fetchGitHubRepoData } from '@/lib/platforms/github';
import { getTwitterInfo, fetchTwitterOEmbed } from '@/lib/platforms/twitter';
import { getYoutubeInfo, getYoutubeThumbnail } from '@/lib/platforms/youtube';

export interface PlatformMetadata {
    github_stars?: number;
    github_forks?: number;
    github_language?: string;
    github_topics?: string[];
    github_description?: string;
    github_owner_avatar?: string;
    twitter_html?: string;
    twitter_author?: string;
    youtube_thumbnail?: string;
}

/**
 * 플랫폼별 메타데이터 수집 (무료 API만 사용)
 */
export async function collectPlatformMetadata(
    platform: string,
    url: string
): Promise<PlatformMetadata | null> {
    try {
        switch (platform) {
            case 'GitHub': {
                const { owner, repo, type } = getGitHubInfo(url);
                if (owner && repo && type === 'repo') {
                    const data = await fetchGitHubRepoData(owner, repo);
                    if (data) {
                        return {
                            github_stars: data.stargazers_count,
                            github_forks: data.forks_count,
                            github_language: data.language || undefined,
                            github_topics: data.topics,
                            github_description: data.description || undefined,
                            github_owner_avatar: data.owner.avatar_url,
                        };
                    }
                }
                break;
            }

            case 'X (Twitter)': {
                const { tweetId } = getTwitterInfo(url);
                if (tweetId) {
                    const data = await fetchTwitterOEmbed(url);
                    if (data) {
                        return {
                            twitter_html: data.html,
                            twitter_author: data.author_name,
                        };
                    }
                }
                break;
            }

            case 'YouTube': {
                const { videoId } = getYoutubeInfo(url);
                if (videoId) {
                    return {
                        youtube_thumbnail: getYoutubeThumbnail(videoId, 'hq'),
                    };
                }
                break;
            }
        }
    } catch (error) {
        console.warn('Failed to collect platform metadata:', error);
    }

    return null;
}
