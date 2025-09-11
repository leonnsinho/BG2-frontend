-- Script de emergência para resetar completamente a tabela profiles
-- Use este script se o anterior não resolver

-- 1. Desabilitar RLS completamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas
DO $$ 
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON profiles';
    END LOOP;
END $$;

-- 3. Testar se a tabela funciona sem RLS
SELECT 'Tabela funcionando sem RLS' as status, COUNT(*) as total_registros FROM profiles;

-- 4. Se quiser manter sem RLS temporariamente, pare aqui
-- Se quiser reabilitar RLS com políticas simples, continue:

-- 5. Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Criar política única e simples para todos os usuários autenticados
CREATE POLICY "authenticated_users_all_access" ON profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 7. Testar novamente
SELECT 'Tabela funcionando com RLS simples' as status, COUNT(*) as total_registros FROM profiles;
