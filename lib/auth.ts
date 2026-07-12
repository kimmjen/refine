import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * API 라우트에서 인증된 사용자 정보 가져오기
 * Authorization 헤더에서 Bearer 토큰을 추출하여 검증
 */
export async function getAuthUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 인증 필수 API 핸들러 래퍼
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await getAuthUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return handler(req, res, user.id);
  };
}

/**
 * 어드민 권한 확인 — admin_users 테이블 기반
 * user_metadata 의존 제거, DB에서 직접 확인
 */
export async function checkAdminRole(req: NextApiRequest): Promise<false | string> {
  const user = await getAuthUser(req);
  if (!user) return false;

  const supabase = createSupabaseServerClient();

  // 1차: admin_users 테이블 확인
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (!error) {
    return data ? user.id : false;
  }

  // fallback: 테이블 미존재 시 user_metadata 확인
  return user.user_metadata?.role === 'admin' ? user.id : false;
}

/**
 * 인증 + 어드민 권한 필수 API 핸들러 래퍼
 */
export function withAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse, adminUserId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const adminId = await checkAdminRole(req);

    if (!adminId) {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }

    return handler(req, res, adminId);
  };
}
