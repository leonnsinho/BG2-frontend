-- Script completo para corrigir recursão infinita em TODAS as tabelas
-- Execute este script no SQL Editor do Supabase

-- 1. CORRIGIR TABELA PROFILES (já corrigida, mas garantindo)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_profiles_access" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. CORRIGIR TABELA COMPANIES
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'companies'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON companies';
    END LOOP;
END $$;

ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_companies_access" ON companies
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. CORRIGIR TABELA USER_COMPANIES
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'user_companies'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON user_companies';
    END LOOP;
END $$;

ALTER TABLE user_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_users_user_companies_access" ON user_companies
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. VERIFICAR TODAS AS TABELAS
SELECT 'profiles' as tabela, COUNT(*) as registros FROM profiles
UNION ALL
SELECT 'companies' as tabela, COUNT(*) as registros FROM companies
UNION ALL
SELECT 'user_companies' as tabela, COUNT(*) as registros FROM user_companies;

-- 5. VERIFICAR POLÍTICAS CRIADAS
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'companies', 'user_companies')
ORDER BY tablename, policyname;

-- 6. MENSAGEM DE SUCESSO
SELECT 'RLS corrigido para todas as tabelas!' as status;
