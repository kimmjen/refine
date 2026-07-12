import { NextApiRequest, NextApiResponse } from 'next';
import { withAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase';

/**
 * SQL 쿼리 서버 사이드 검증
 * DB 함수의 검증과 이중으로 방어
 */
function validateQuery(query: string): { valid: boolean; error?: string } {
    const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');

    // SELECT 또는 WITH로 시작해야 함
    if (!normalized.startsWith('select ') && !normalized.startsWith('with ')) {
        return { valid: false, error: 'Only SELECT queries are allowed.' };
    }

    // DML/DDL 키워드 차단
    const forbidden = /\b(insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s|truncate\s|alter\s|create\s|grant\s|revoke\s|copy\s)\b/;
    if (forbidden.test(normalized)) {
        return { valid: false, error: 'Query contains forbidden keywords.' };
    }

    // SELECT INTO 차단
    if (/\binto\s+\w/.test(normalized) && !/\binto\s+(result|json)\b/.test(normalized)) {
        return { valid: false, error: 'SELECT INTO is not allowed.' };
    }

    // 위험 함수 차단
    if (/\b(pg_read_file|pg_write_file|pg_execute_server_program|lo_import|lo_export)\b/.test(normalized)) {
        return { valid: false, error: 'Filesystem functions are not allowed.' };
    }

    return { valid: true };
}

export default withAdmin(async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createSupabaseServerClient();

    try {
        switch (req.method) {
            case 'GET': {
                const type = req.query.type as string;

                let fnName = '';
                switch (type) {
                    case 'schema': fnName = 'admin_get_schema'; break;
                    case 'functions': fnName = 'admin_get_functions'; break;
                    case 'triggers': fnName = 'admin_get_triggers'; break;
                    case 'policies': fnName = 'admin_get_policies'; break;
                    default:
                        return res.status(400).json({ error: 'Invalid type. Use: schema, functions, triggers, policies' });
                }

                const { data, error } = await supabase.rpc(fnName);
                if (error) throw error;
                return res.status(200).json({ data: data || [] });
            }

            case 'POST': {
                const { query } = req.body;
                if (!query || typeof query !== 'string') {
                    return res.status(400).json({ error: 'SQL query required' });
                }

                // 쿼리 길이 제한 (10KB)
                if (query.length > 10240) {
                    return res.status(400).json({ error: 'Query too long (max 10KB)' });
                }

                // 서버 사이드 검증 (DB 함수 검증과 이중 방어)
                const validation = validateQuery(query);
                if (!validation.valid) {
                    return res.status(400).json({ error: validation.error });
                }

                const { data, error } = await supabase.rpc('admin_exec_sql', { query });
                if (error) throw error;
                return res.status(200).json({ data: data || [] });
            }

            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Admin SQL error:', error);
        return res.status(500).json({ error: error.message || 'SQL execution failed' });
    }
});
