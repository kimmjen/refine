/**
 * YouTube 관련 유틸리티
 */

export interface YoutubeInfo {
  videoId: string | null;
  listId: string | null;
  isShorts: boolean;
}

/**
 * YouTube URL에서 Video ID, Playlist ID, Shorts 여부 추출
 * 
 * 지원 형식:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
 */
export function getYoutubeInfo(urlString: string): YoutubeInfo {
  let videoId: string | null = null;
  let listId: string | null = null;
  let isShorts = false;

  try {
    const url = new URL(urlString.startsWith('http') ? urlString : `https://${urlString}`);
    listId = url.searchParams.get('list');

    // youtu.be 단축 URL
    if (url.hostname.includes('youtu.be')) {
      videoId = url.pathname.slice(1);
    }
    // Shorts
    else if (url.pathname.startsWith('/shorts/')) {
      videoId = url.pathname.split('/shorts/')[1];
      isShorts = true;
    }
    // Embed
    else if (url.pathname.includes('/embed/')) {
      videoId = url.pathname.split('/embed/')[1];
    }
    // 일반 watch URL
    else {
      videoId = url.searchParams.get('v');
    }
  } catch {
    // URL 파싱 실패 시 정규식으로 시도
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = urlString.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
      if (urlString.includes('shorts')) isShorts = true;
    }
  }

  // 쿼리 파라미터 정리
  if (videoId) videoId = videoId.split(/[?#&]/)[0];
  if (listId) listId = listId.split(/[?#&]/)[0];

  return { videoId, listId, isShorts };
}

/**
 * YouTube 임베드 URL 생성
 */
export function getYoutubeEmbedUrl(videoId: string, listId?: string | null): string {
  let url = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  if (listId) url += `&list=${listId}`;
  return url;
}

/**
 * YouTube 썸네일 URL 생성
 */
export function getYoutubeThumbnail(videoId: string, quality: 'default' | 'mq' | 'hq' | 'maxres' = 'mq'): string {
  const qualityMap = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}
