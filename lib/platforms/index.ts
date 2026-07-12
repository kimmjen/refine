/**
 * 플랫폼 감지 및 공통 유틸리티
 * — 데이터 맵 기반 + 도메인 자동 추출 폴백
 */

/**
 * hostname 키워드 → 플랫폼 이름 매핑
 * 순서: 매칭 우선순위 (먼저 매칭되면 반환)
 */
const PLATFORM_MAP: Record<string, string> = {
  // Video
  'youtube': 'YouTube',
  'youtu.be': 'YouTube',
  'tiktok': 'TikTok',
  'vimeo': 'Vimeo',
  'twitch': 'Twitch',
  'dailymotion': 'Dailymotion',

  // Social
  'instagram': 'Instagram',
  'threads.net': 'Threads',
  'threads.com': 'Threads',
  'twitter': 'X (Twitter)',
  'x.com': 'X (Twitter)',
  'facebook': 'Facebook',
  'linkedin': 'LinkedIn',
  'reddit': 'Reddit',
  'mastodon': 'Mastodon',
  'bluesky': 'Bluesky',
  'bsky.app': 'Bluesky',

  // Dev
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'bitbucket': 'Bitbucket',
  'stackoverflow': 'Stack Overflow',
  'stackexchange': 'Stack Exchange',
  'dev.to': 'DEV',
  'hashnode': 'Hashnode',
  'codepen': 'CodePen',
  'codesandbox': 'CodeSandbox',
  'npmjs': 'npm',
  'pypi.org': 'PyPI',

  // Design
  'figma': 'Figma',
  'dribbble': 'Dribbble',
  'behance': 'Behance',
  'canva': 'Canva',

  // Productivity
  'notion': 'Notion',
  'slack': 'Slack',
  'discord': 'Discord',
  'trello': 'Trello',
  'linear.app': 'Linear',
  'asana': 'Asana',

  // Blog / Content
  'medium': 'Medium',
  'substack': 'Substack',
  'wordpress': 'WordPress',
  'ghost.io': 'Ghost',
  'mirror.xyz': 'Mirror',

  // Korean
  'naver': 'Naver',
  'daum.net': 'Daum',
  'kakao': 'Kakao',
  'tistory': 'Tistory',
  'velog': 'Velog',
  'brunch.co.kr': 'Brunch',

  // News / Knowledge
  'bbc': 'BBC',
  'nytimes': 'NY Times',
  'wikipedia': 'Wikipedia',
  'arxiv.org': 'arXiv',

  // Product
  'producthunt': 'Product Hunt',
  'news.ycombinator': 'Hacker News',

  // Shopping
  'amazon': 'Amazon',
  'coupang': 'Coupang',
  'ebay': 'eBay',
  'aliexpress': 'AliExpress',

  // Music / Audio
  'spotify': 'Spotify',
  'music.apple': 'Apple Music',
  'soundcloud': 'SoundCloud',

  // Streaming
  'netflix': 'Netflix',
  'disneyplus': 'Disney+',
  'watcha': 'Watcha',
  'wavve': 'Wavve',

  // AI
  'openai': 'OpenAI',
  'huggingface': 'Hugging Face',
  'chatgpt': 'ChatGPT',
  'claude.ai': 'Claude',
  'perplexity': 'Perplexity',

  // Cloud
  'vercel': 'Vercel',
  'netlify': 'Netlify',
  'render.com': 'Render',
  'railway.app': 'Railway',
  'supabase': 'Supabase',
  'firebase': 'Firebase',
  'aws.amazon': 'AWS',

  // Docs / Learning
  'docs.google': 'Google Docs',
  'drive.google': 'Google Drive',
  'sheets.google': 'Google Sheets',
  'udemy': 'Udemy',
  'coursera': 'Coursera',
  'inflearn': 'Inflearn',

  // Maps / Travel
  'google.com/maps': 'Google Maps',
  'airbnb': 'Airbnb',
  'booking.com': 'Booking',
  'tripadvisor': 'TripAdvisor',

  // Apple
  'apple.com': 'Apple',
  'apps.apple': 'App Store',
  'play.google': 'Google Play',
};

// 비디오 플랫폼 세트
const VIDEO_PLATFORMS = new Set([
  'YouTube', 'TikTok', 'Vimeo', 'Twitch', 'Dailymotion',
  'Netflix', 'Disney+', 'Watcha', 'Wavve',
]);

// 소셜 플랫폼 세트
const SOCIAL_PLATFORMS = new Set([
  'Instagram', 'Threads', 'X (Twitter)', 'Facebook',
  'LinkedIn', 'Reddit', 'Mastodon', 'Bluesky',
]);

/**
 * URL에서 플랫폼 자동 감지
 * 1. PLATFORM_MAP에서 hostname 매칭
 * 2. 매칭 없으면 도메인명에서 자동 추출 (예: "somesite.io" → "Somesite")
 */
export function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '').toLowerCase();

    // 1. 데이터 맵에서 매칭 (더 구체적인 키부터 확인)
    for (const [key, name] of Object.entries(PLATFORM_MAP)) {
      if (hostname.includes(key)) return name;
    }

    // 2. 폴백: 도메인명에서 사이트 이름 추출
    return extractSiteName(hostname);
  } catch {
    return 'Website';
  }
}

/**
 * 호스트네임에서 사이트 이름 추출
 * "blog.example.co.kr" → "Example"
 * "my-cool-site.io" → "My Cool Site"
 */
function extractSiteName(hostname: string): string {
  // co.kr, co.jp 등 2단계 TLD 처리
  const multiTlds = ['.co.kr', '.co.jp', '.co.uk', '.com.br', '.or.kr', '.ac.kr', '.go.kr', '.ne.jp'];
  let cleanHost = hostname;
  for (const tld of multiTlds) {
    if (cleanHost.endsWith(tld)) {
      cleanHost = cleanHost.slice(0, -tld.length);
      const parts = cleanHost.split('.');
      return capitalize(parts[parts.length - 1]);
    }
  }

  // 일반 도메인: "sub.example.com" → "example"
  const parts = cleanHost.split('.');
  if (parts.length >= 2) {
    const name = parts[parts.length - 2]; // TLD 바로 앞
    return capitalize(name);
  }

  return capitalize(cleanHost);
}

/**
 * 하이픈 포함 문자열을 Title Case로 변환
 * "my-cool-site" → "My Cool Site"
 */
function capitalize(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * 플랫폼이 비디오 플랫폼인지 확인
 */
export function isVideoPlatform(platform: string): boolean {
  return VIDEO_PLATFORMS.has(platform);
}

/**
 * 플랫폼이 소셜 미디어인지 확인
 */
export function isSocialPlatform(platform: string): boolean {
  return SOCIAL_PLATFORMS.has(platform);
}

/**
 * 스크래핑 결과가 로그인 월(wall)인지 감지
 * title과 description 중 하나라도 로그인 페이지 패턴이면 true
 */
export function isLoginWall(title: string | null, description: string | null): boolean {
  const t = (title ?? '').toLowerCase();
  const d = (description ?? '').toLowerCase();
  return (
    t.includes('login •') ||
    t.includes('log in •') ||
    t === 'log in to continue' ||
    (t.includes('sign in') && t.includes('instagram')) ||
    d.startsWith('welcome back to instagram') ||
    d.includes('sign in to check out')
  );
}

/**
 * title만으로 로그인 월 여부 감지 (DB에 저장된 타이틀 검사용)
 */
export function isLoginWallTitle(title: string | null): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  return t.includes('login •') || t.includes('log in •') || t.startsWith('welcome back to');
}

/**
 * Instagram URL 구조에서 폴백 타이틀 생성
 * 서버 스크래핑이 불가한 경우 URL 패턴으로 추론
 */
export function instagramFallbackTitle(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (!hostname.includes('instagram.com')) return null;
    if (pathname.startsWith('/reel/')) return 'Instagram Reel';
    if (pathname.startsWith('/p/')) return 'Instagram Post';
    if (pathname.startsWith('/stories/')) return 'Instagram Story';
    const match = pathname.match(/^\/([^\/]+)/);
    if (match) return `@${match[1]} • Instagram`;
  } catch { /* ignore */ }
  return null;
}
