-- admin_users 테이블: 관리자 권한을 DB 레벨에서 관리
-- user_metadata 의존 제거, DB 기반 admin 판별

CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- service_role만 접근 가능 (일반 유저는 직접 조회 불가)
CREATE POLICY "Service role only" ON admin_users
    FOR ALL
    USING (auth.role() = 'service_role');

-- admin 여부 확인 함수 (API에서 사용)
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = check_user_id);
END;
$$;

-- admin_exec_sql 보안 강화: 위험 키워드 차단
CREATE OR REPLACE FUNCTION admin_exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    normalized text;
BEGIN
    -- 정규화: 소문자 변환 + 여러 공백을 하나로
    normalized := regexp_replace(trim(lower(query)), '\s+', ' ', 'g');

    -- SELECT 또는 WITH로 시작해야 함
    IF NOT (normalized LIKE 'select %' OR normalized LIKE 'with %') THEN
        RAISE EXCEPTION 'Only SELECT queries are allowed.';
    END IF;

    -- 위험 키워드 차단 (서브쿼리 내 DML/DDL 방지)
    IF normalized ~ '(insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s|truncate\s|alter\s|create\s|grant\s|revoke\s|copy\s)' THEN
        RAISE EXCEPTION 'Query contains forbidden keywords (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, GRANT, REVOKE, COPY, TRUNCATE).';
    END IF;

    -- INTO 절 차단 (SELECT INTO 방지)
    IF normalized ~ 'into\s+\w' AND normalized !~ 'into\s+(result|json)' THEN
        RAISE EXCEPTION 'SELECT INTO is not allowed.';
    END IF;

    -- pg_read_file, pg_write_file 등 위험 함수 차단
    IF normalized ~ '(pg_read_file|pg_write_file|pg_execute_server_program|lo_import|lo_export)' THEN
        RAISE EXCEPTION 'Access to filesystem functions is not allowed.';
    END IF;

    -- 결과 행 수 제한 (최대 500행)
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM (' || query || ') _inner LIMIT 500) t' INTO result;
    RETURN COALESCE(result, '[]'::json);
END;
$$;
