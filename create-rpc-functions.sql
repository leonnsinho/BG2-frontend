-- Script para criar funções RPC que estão faltando
-- Execute este script no SQL Editor do Supabase

-- 1. Função para obter timestamp atual (substitui rpc/now)
CREATE OR REPLACE FUNCTION public.now()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT now();
$$;

-- 2. Função para listar tabelas (substitui rpc/get_tables)
CREATE OR REPLACE FUNCTION public.get_tables()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_agg(
    json_build_object(
      'table_name', tablename,
      'schema_name', schemaname
    )
  )
  FROM pg_tables 
  WHERE schemaname = 'public';
$$;

-- 3. Função para verificar políticas de uma tabela
CREATE OR REPLACE FUNCTION public.get_table_policies(table_name text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_agg(
    json_build_object(
      'policyname', policyname,
      'cmd', cmd,
      'permissive', permissive,
      'roles', roles,
      'qual', qual,
      'with_check', with_check
    )
  )
  FROM pg_policies 
  WHERE tablename = table_name;
$$;

-- 4. Função para verificar status do RLS
CREATE OR REPLACE FUNCTION public.check_rls_status(table_name text)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'table_name', c.relname,
    'rls_enabled', c.relrowsecurity,
    'rls_forced', c.relforcerowsecurity
  )
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE c.relname = table_name 
    AND n.nspname = 'public'
    AND c.relkind = 'r';
$$;

-- 5. Função para teste de conectividade
CREATE OR REPLACE FUNCTION public.ping()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'status', 'ok',
    'timestamp', now(),
    'version', version()
  );
$$;

-- 6. Verificar se as funções foram criadas
SELECT 
  routine_name as function_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('now', 'get_tables', 'get_table_policies', 'check_rls_status', 'ping')
ORDER BY routine_name;

-- 7. Testar as funções
SELECT 'Testando funções RPC...' as status;
SELECT public.ping() as ping_test;
SELECT public.now() as now_test;
SELECT public.get_tables() as tables_test;
