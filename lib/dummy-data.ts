import { SharedLink, LinkMetadata } from "@/types/db";

export const DUMMY_LINK: SharedLink = {
  id: 999,
  created_at: new Date().toISOString(),
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  title: "The Ultimate Guide to Modern Web Development with Next.js 15, React 19, and Server Actions (2025 Edition)",
  description: "In this comprehensive guide, we explore the cutting-edge features of Next.js 15. \n\nWe cover:\n- Server Actions for form handling\n- The new caching model\n- Streaming and Suspense\n- Optimizing images and fonts\n\nThis is a must-watch for any frontend developer looking to stay ahead of the curve. Don't forget to like and subscribe for more deep dives into web technologies!",
  platform: "Youtube",
  image_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop",
  category: "Development",
  is_read: false,
  user_id: "dummy-user-id",
  dispatched_to: null,
  dispatched_at: null,
  target_id: null
};

export const DUMMY_METADATA: LinkMetadata = {
  id: 999,
  link_id: 999,
  github_stars: null,
  github_forks: null,
  twitter_html: null,
  youtube_thumbnail: null,
  ai_summary: "Next.js 15와 React 19의 핵심 기능을 다루는 포괄적인 웹 개발 가이드 영상입니다.",
  ai_tags: ["Next.js", "React 19", "Web Dev", "Tutorial", "Frontend"],
  fetched_at: new Date().toISOString()
};
