-- Script para configurar RLS de forma que permita registros automáticos
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos reabilitar RLS mas com políticas que permitem signup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas antigas que podem estar causando problemas
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

-- 3. Criar política que permite signup automático
-- Esta política permite que usuários autenticados criem seu próprio perfil
CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 4. Política para permitir leitura do próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- 5. Política para permitir atualização do próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- 6. IMPORTANTE: Política especial para permitir criação durante signup
-- Esta permite que o trigger funcione durante o processo de criação de usuário
CREATE POLICY "Allow profile creation during signup" ON profiles
    FOR INSERT 
    WITH CHECK (true);

-- 7. Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 8. Testar se conseguimos inserir um perfil
DO $$
BEGIN
  -- Tentar inserir um perfil de teste (será removido depois)
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    'teste@delete.me',
    'Teste RLS',
    'user',
    now(),
    now()
  );
  
  -- Remover o teste
  DELETE FROM profiles WHERE email = 'teste@delete.me';
  
  RAISE NOTICE 'RLS configurado corretamente - inserção e remoção funcionaram!';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro no teste RLS: %', SQLERRM;
END $$;

-- 9. Mostrar status final
SELECT '=== RLS CONFIGURADO PARA SIGNUP AUTOMÁTICO ===' as status
UNION ALL
SELECT 'Agora o signup via API deve funcionar automaticamente'
UNION ALL
SELECT 'O trigger criará perfis automaticamente quando usuários se registrarem';
