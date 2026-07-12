/**
 * URL 관련 유틸리티 함수
 */

/**
 * URL 정규화
 * www, trailing slash, 프로토콜 차이 등을 통일
 * @example normalizeUrl("https://www.example.com/path/") => "example.com/path"
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const pathname = parsed.pathname.replace(/\/$/, '');
    return `${hostname}${pathname}${parsed.search}`;
  } catch {
    return url.toLowerCase();
  }
}

/**
 * URL에서 검색용 변형들 생성
 * www 유무, http/https 차이를 모두 커버
 */
export function getUrlVariants(url: string): string[] {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const hostnameNoWww = hostname.replace(/^www\./, '');
    const hostnameWithWww = hostname.startsWith('www.') ? hostname : `www.${hostname}`;
    const path = parsed.pathname + parsed.search;

    // 가능한 URL 변형들 (중복 제거)
    return [
      `http://${hostnameNoWww}${path}`,
      `https://${hostnameNoWww}${path}`,
      `http://${hostnameWithWww}${path}`,
      `https://${hostnameWithWww}${path}`,
      // trailing slash 버전
      `http://${hostnameNoWww}${path}/`,
      `https://${hostnameNoWww}${path}/`,
      `http://${hostnameWithWww}${path}/`,
      `https://${hostnameWithWww}${path}/`,
    ].filter((v, i, arr) => arr.indexOf(v) === i);
  } catch {
    return [url];
  }
}

/**
 * URL에 프로토콜이 없으면 https:// 추가
 */
export function ensureProtocol(url: string | null | undefined): string {
  if (!url) return '';
  if (url.match(/^https?:\/\//i)) return url;
  return `https://${url}`;
}
