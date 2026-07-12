/**
 * Twitter/X 관련 유틸리티
 */

export interface TwitterInfo {
  tweetId: string | null;
  username: string | null;
  isThread: boolean;
}

/**
 * Twitter/X URL에서 트윗 ID 및 사용자명 추출
 * 
 * 지원 형식:
 * - https://twitter.com/username/status/123456789
 * - https://x.com/username/status/123456789
 * - https://twitter.com/username
 */
export function getTwitterInfo(url: string): TwitterInfo {
  let tweetId: string | null = null;
  let username: string | null = null;
  let isThread = false;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // 사용자명 추출
    if (pathParts.length >= 1) {
      username = pathParts[0];
    }

    // 트윗 ID 추출
    if (pathParts.length >= 3 && pathParts[1] === 'status') {
      tweetId = pathParts[2];
    }

    // 스레드 여부 확인
    if (parsed.searchParams.has('s') || url.includes('/thread/')) {
      isThread = true;
    }
  } catch {
    // URL 파싱 실패
  }

  return { tweetId, username, isThread };
}

/**
 * Twitter 임베드 URL 생성 (oEmbed)
 */
export function getTwitterEmbedHtml(tweetUrl: string): string {
  // Twitter의 기본 임베드 스크립트 사용
  return `
    <blockquote class="twitter-tweet" data-dnt="true">
      <a href="${tweetUrl}"></a>
    </blockquote>
  `;
}

/**
 * Twitter oEmbed API URL 생성
 */
export function getTwitterOEmbedUrl(tweetUrl: string): string {
  return `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true&dnt=true`;
}

export interface TwitterOEmbed {
  url: string;
  author_name: string;
  author_url: string;
  html: string;
  width: number;
  height: number | null;
  type: string;
  cache_age: string;
  provider_name: string;
  provider_url: string;
  version: string;
}

/**
 * Twitter oEmbed API에서 트윗 데이터 fetch (무제한)
 */
export async function fetchTwitterOEmbed(tweetUrl: string): Promise<TwitterOEmbed | null> {
  try {
    const res = await fetch(getTwitterOEmbedUrl(tweetUrl), { signal: AbortSignal.timeout(5000) });

    if (!res.ok) {
      console.warn(`Twitter oEmbed error: ${res.status} for ${tweetUrl}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch Twitter oEmbed:', error);
    return null;
  }
}

