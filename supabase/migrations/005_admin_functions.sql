-- 관리자 전용 SQL 실행 함수
-- Supabase SQL Editor에서 실행해주세요

-- 1. admin_exec_sql: 읽기 전용 SQL 실행 (SELECT만)
CREATE OR REPLACE FUNCTION admin_exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- SELECT 문만 허용 (안전장치)
  IF NOT (trim(lower(query)) LIKE 'select%' OR trim(lower(query)) LIKE 'with%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed for safety. Use Supabase Dashboard for DDL.';
  END IF;

  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 2. admin_get_schema: 현재 DB 스키마 조회
CREATE OR REPLACE FUNCTION admin_get_schema()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      c.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.character_maximum_length
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 3. admin_get_functions: 사용자 정의 함수 목록
CREATE OR REPLACE FUNCTION admin_get_functions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      p.proname AS function_name,
      pg_get_function_arguments(p.oid) AS arguments,
      pg_get_function_result(p.oid) AS return_type,
      CASE p.prokind
        WHEN 'f' THEN 'function'
        WHEN 'p' THEN 'procedure'
        WHEN 'a' THEN 'aggregate'
        WHEN 'w' THEN 'window'
      END AS kind,
      l.lanname AS language,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
    WHERE n.nspname = 'public'
    ORDER BY p.proname
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 4. admin_get_triggers: 트리거 목록
CREATE OR REPLACE FUNCTION admin_get_triggers()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      trigger_name,
      event_object_table AS table_name,
      event_manipulation AS event,
      action_timing AS timing,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 5. admin_get_policies: RLS 정책 목록
CREATE OR REPLACE FUNCTION admin_get_policies()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT
      polname AS policy_name,
      relname AS table_name,
      CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
      END AS command,
      CASE
        WHEN polpermissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
      END AS type,
      pg_get_expr(polqual, polrelid) AS using_expression,
      pg_get_expr(polwithcheck, polrelid) AS check_expression
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
    WHERE nsp.nspname = 'public'
    ORDER BY relname, polname
  ) t;
  RETURN COALESCE(result, '[]'::json);
END;
$$;
