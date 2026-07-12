export interface SharedLink {
  id: number;
  created_at: string;
  url: string;
  title: string | null;
  description: string | null;
  platform: string | null;
  image_url: string | null;
  category: string | null;
  is_read: boolean;
  user_id: string | null; // Auth user UUID
  dispatched_to: string | null; // 'CURA' or 'MY_STANDARD_DOC'
  dispatched_at: string | null;
  target_id: string | null;
}

export type NewSharedLink = Omit<SharedLink, 'id' | 'created_at'>;

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

// Platform-specific metadata
export interface LinkMetadata {
  id: number;
  link_id: number;

  // GitHub
  github_stars?: number;
  github_forks?: number;
  github_language?: string;
  github_topics?: string[];
  github_description?: string;
  github_owner_avatar?: string;

  // Twitter/X (oEmbed)
  twitter_html?: string;
  twitter_author?: string;

  // YouTube
  youtube_title?: string;
  youtube_channel?: string;
  youtube_thumbnail?: string;
  youtube_duration?: string;

  // Instagram (oEmbed)
  instagram_html?: string;
  instagram_author?: string;

  // Reddit
  reddit_title?: string;
  reddit_subreddit?: string;
  reddit_upvotes?: number;
  reddit_comments?: number;
  reddit_author?: string;

  // TikTok (oEmbed)
  tiktok_title?: string;
  tiktok_author?: string;
  tiktok_thumbnail?: string;

  // AI Enrichment
  ai_summary?: string;
  ai_tags?: string[];

  fetched_at: string;
}

export interface SharedLinkWithMetadata extends SharedLink {
  link_metadata?: LinkMetadata | null;
}

export interface LinkImage {
  id: number;
  link_id: number;
  image_type: 'og' | 'thumbnail' | 'avatar' | 'content';
  original_url?: string;
  storage_path?: string;
  created_at: string;
}

export type AiProvider = 'gemini' | 'chatgpt' | 'claude' | 'none';

export interface AiSettings {
  user_id: string;
  ai_provider: AiProvider;
  gemini_api_key: string | null;
  openai_api_key: string | null;
  claude_api_key: string | null;
  ai_auto_classify: boolean;
  ai_auto_summary: boolean;
  ai_auto_tags: boolean;
  preferred_language: string;
  updated_at: string;
}

export const DEFAULT_AI_SETTINGS: Omit<AiSettings, 'user_id' | 'updated_at'> = {
  ai_provider: 'none',
  gemini_api_key: null,
  openai_api_key: null,
  claude_api_key: null,
  ai_auto_classify: true,
  ai_auto_summary: true,
  ai_auto_tags: true,
  preferred_language: 'en',
};
