import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 환경변수 유효성 체크
const isConfigured = supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('https://');

// 싱글톤 패턴으로 브라우저 클라이언트 관리
let browserClient: SupabaseClient | null = null;

/**
 * 브라우저용 Supabase 클라이언트 (Auth 포함)
 * - 클라이언트 컴포넌트에서 사용
 * - 자동으로 세션 관리
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  // 개발 모드에서만 경고 (최초 1회)
  if (!isConfigured && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // @ts-ignore - suppress duplicate warnings
    if (!window.__supabaseWarned) {
      console.warn('[Supabase] Credentials may not be loaded yet. If OAuth works, ignore this.');
      // @ts-ignore
      window.__supabaseWarned = true;
    }
  }

  // 서버 사이드에서는 매번 새로 생성하되, 유효한 경우에만
  if (typeof window === 'undefined') {
    if (!isConfigured) {
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  // 브라우저에서는 싱글톤 사용 (Multiple instances 방지)
  if (!browserClient && isConfigured) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'refine-auth', // 고유 스토리지 키
      },
    });
  }

  // 설정되지 않은 경우 더미 클라이언트
  if (!browserClient) {
    browserClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return browserClient;
}

/**
 * 서버용 Supabase 클라이언트 (Service Role)
 * - API Routes에서 사용
 * - RLS 우회 가능 (주의해서 사용)
 */
export function createSupabaseServerClient(): SupabaseClient {
  if (!isConfigured) {
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  );
}
