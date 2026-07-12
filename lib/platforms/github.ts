/**
 * GitHub 관련 유틸리티
 */

export interface GitHubInfo {
  owner: string | null;
  repo: string | null;
  type: 'repo' | 'profile' | 'gist' | 'issue' | 'pr' | 'other';
  issueNumber?: string;
}

export interface GitHubRepoData {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  open_issues_count: number;
  license: {
    name: string;
  } | null;
}

/**
 * GitHub URL에서 정보 추출
 * 
 * 지원 형식:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/issues/123
 * - https://github.com/owner/repo/pull/123
 * - https://github.com/owner
 * - https://gist.github.com/owner/id
 */
export function getGitHubInfo(url: string): GitHubInfo {
  let owner: string | null = null;
  let repo: string | null = null;
  let type: GitHubInfo['type'] = 'other';
  let issueNumber: string | undefined;

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // Gist 처리
    if (parsed.hostname === 'gist.github.com') {
      owner = pathParts[0] || null;
      type = 'gist';
      return { owner, repo: null, type };
    }

    // 일반 GitHub URL
    if (pathParts.length >= 1) {
      owner = pathParts[0];
      type = 'profile';
    }

    if (pathParts.length >= 2) {
      repo = pathParts[1];
      type = 'repo';
    }

    // Issue 또는 PR
    if (pathParts.length >= 4) {
      if (pathParts[2] === 'issues') {
        type = 'issue';
        issueNumber = pathParts[3];
      } else if (pathParts[2] === 'pull') {
        type = 'pr';
        issueNumber = pathParts[3];
      }
    }
  } catch {
    // URL 파싱 실패
  }

  return { owner, repo, type, issueNumber };
}

/**
 * GitHub API URL 생성
 */
export function getGitHubApiUrl(owner: string, repo: string): string {
  return `https://api.github.com/repos/${owner}/${repo}`;
}

/**
 * 숫자 포맷 (1000 -> 1k)
 */
export function formatGitHubCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'm';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

/**
 * 언어별 색상 매핑
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'Java': '#b07219',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'C++': '#f34b7d',
  'C': '#555555',
  'Ruby': '#701516',
  'PHP': '#4F5D95',
  'Swift': '#F05138',
  'Kotlin': '#A97BFF',
  'Dart': '#00B4AB',
  'Shell': '#89e051',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Vue': '#41b883',
  'Svelte': '#ff3e00',
};

/**
 * GitHub API에서 저장소 데이터 fetch (비인증 - 60회/시간)
 */
export async function fetchGitHubRepoData(owner: string, repo: string): Promise<GitHubRepoData | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Refine-Link-Collector'
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`GitHub API error: ${res.status} for ${owner}/${repo}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch GitHub repo data:', error);
    return null;
  }
}

